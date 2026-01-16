'use client'

import { useState, useEffect, useCallback } from 'react'
import { Table, Card, Select, DatePicker, Button, Space, Tag, TablePaginationConfig } from 'antd'
import { ColumnsType } from 'antd/es/table'
import { FilterOutlined, ReloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

interface AuditLog {
  id: string
  userId?: string
  userEmail?: string
  userRole?: string
  action: string
  resourceType: string
  resourceId?: string
  ipAddress?: string
  success: boolean
  errorMessage?: string
  severity: string
  createdAt: string
}

export default function AuditLogPage() {
  const [data, setData] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
  })
  const [filters, setFilters] = useState({
    action: undefined as string | undefined,
    resourceType: undefined as string | undefined,
    severity: undefined as string | undefined,
    dateRange: undefined as [dayjs.Dayjs, dayjs.Dayjs] | undefined,
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('auth-token')
      const url = new URL('/api/admin/audit-log', window.location.origin)
      url.searchParams.set('page', String(pagination.current))
      url.searchParams.set('limit', String(pagination.pageSize))
      
      if (filters.action) url.searchParams.set('action', filters.action)
      if (filters.resourceType) url.searchParams.set('resourceType', filters.resourceType)
      if (filters.severity) url.searchParams.set('severity', filters.severity)
      if (filters.dateRange) {
        url.searchParams.set('startDate', filters.dateRange[0].toISOString())
        url.searchParams.set('endDate', filters.dateRange[1].toISOString())
      }
      
      const response = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!response.ok) throw new Error('Failed to fetch audit logs')
      
      const result = await response.json()
      setData(Array.isArray(result.data) ? result.data : [])
      setPagination(prev => ({ ...prev, total: result.meta?.total || 0 }))
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }, [pagination.current, pagination.pageSize, filters])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleTableChange = (newPagination: TablePaginationConfig) => {
    setPagination(newPagination)
  }

  const clearFilters = () => {
    setFilters({
      action: undefined,
      resourceType: undefined,
      severity: undefined,
      dateRange: undefined,
    })
  }

  const columns: ColumnsType<AuditLog> = [
    {
      title: 'Timestamp',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: 'User',
      dataIndex: 'userEmail',
      key: 'userEmail',
      width: 200,
      render: (email: string, record) => (
        <div>
          <div>{email || 'System'}</div>
          {record.userRole && <Tag>{record.userRole}</Tag>}
        </div>
      ),
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      width: 150,
      render: (action: string) => <Tag color="blue">{action}</Tag>,
    },
    {
      title: 'Resource',
      dataIndex: 'resourceType',
      key: 'resourceType',
      width: 120,
      render: (type: string) => <Tag>{type}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'success',
      key: 'success',
      width: 100,
      render: (success: boolean) => (
        <Tag color={success ? 'green' : 'red'}>
          {success ? 'Success' : 'Failed'}
        </Tag>
      ),
    },
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      render: (severity: string) => {
        const colors: Record<string, string> = {
          LOW: 'default',
          MEDIUM: 'blue',
          HIGH: 'orange',
          CRITICAL: 'red',
        }
        return <Tag color={colors[severity] || 'default'}>{severity}</Tag>
      },
    },
    {
      title: 'IP Address',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 150,
    },
    {
      title: 'Error',
      dataIndex: 'errorMessage',
      key: 'errorMessage',
      ellipsis: true,
      render: (error: string) => error || '-',
    },
  ]

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title="Audit Log"
        extra={
          <Button icon={<ReloadOutlined />} onClick={fetchData}>
            Refresh
          </Button>
        }
      >
        <Space style={{ marginBottom: 16 }} wrap>
          <Select
            placeholder="Filter by Action"
            style={{ width: 200 }}
            onChange={(value) => setFilters(prev => ({ ...prev, action: value }))}
            value={filters.action}
            allowClear
          >
            <Select.Option value="LOGIN">Login</Select.Option>
            <Select.Option value="LOGOUT">Logout</Select.Option>
            <Select.Option value="LOGIN_FAILED">Login Failed</Select.Option>
            <Select.Option value="DATA_CREATE">Data Create</Select.Option>
            <Select.Option value="DATA_UPDATE">Data Update</Select.Option>
            <Select.Option value="DATA_DELETE">Data Delete</Select.Option>
            <Select.Option value="DATA_EXPORT">Data Export</Select.Option>
          </Select>

          <Select
            placeholder="Filter by Resource"
            style={{ width: 200 }}
            onChange={(value) => setFilters(prev => ({ ...prev, resourceType: value }))}
            value={filters.resourceType}
            allowClear
          >
            <Select.Option value="USER">User</Select.Option>
            <Select.Option value="LEAD">Lead</Select.Option>
            <Select.Option value="CAMPAIGN">Campaign</Select.Option>
            <Select.Option value="SESSION">Session</Select.Option>
            <Select.Option value="SYSTEM">System</Select.Option>
          </Select>

          <Select
            placeholder="Filter by Severity"
            style={{ width: 150 }}
            onChange={(value) => setFilters(prev => ({ ...prev, severity: value }))}
            value={filters.severity}
            allowClear
          >
            <Select.Option value="LOW">Low</Select.Option>
            <Select.Option value="MEDIUM">Medium</Select.Option>
            <Select.Option value="HIGH">High</Select.Option>
            <Select.Option value="CRITICAL">Critical</Select.Option>
          </Select>

          <RangePicker
            onChange={(dates) => setFilters(prev => ({ 
              ...prev, 
              dateRange: dates as [dayjs.Dayjs, dayjs.Dayjs] | undefined 
            }))}
            value={filters.dateRange}
          />

          <Button icon={<FilterOutlined />} onClick={clearFilters}>
            Clear Filters
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  )
}
