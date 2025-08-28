'use client'

import { useState, useEffect } from 'react'
import { Table, Tag, Typography, DatePicker, Button, Space } from 'antd'
import { ColumnsType } from 'antd/es/table'
import { apiClient } from '@/lib/api/api-client'
import Papa from 'papaparse'
import dayjs from 'dayjs'

const { Title } = Typography
const { RangePicker } = DatePicker

interface AuditLog {
  userId?: string
  action: string
  resource: string
  resourceId?: string
  details?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  timestamp: string
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null)

  const fetchLogs = async (dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null = dateRange) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (dates?.[0]) {
        params.append('fromDate', dates[0].toISOString())
      }
      if (dates?.[1]) {
        params.append('toDate', dates[1].toISOString())
      }
      const data = await apiClient.get<AuditLog[]>(`/admin/audit-log?${params.toString()}`)
      setLogs(data)
    } catch (err) {
      setError('Failed to load audit logs.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  const handleFilter = () => {
    fetchLogs(dateRange)
  }

  const handleExport = () => {
    const csv = Papa.unparse(logs)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.setAttribute('download', 'audit_log.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const columns: ColumnsType<AuditLog> = [
    { title: 'Timestamp', dataIndex: 'timestamp', key: 'timestamp', render: (date: string) => new Date(date).toLocaleString() },
    { title: 'User ID', dataIndex: 'userId', key: 'userId' },
    { title: 'Action', dataIndex: 'action', key: 'action', render: (action: string) => <Tag>{action}</Tag> },
    { title: 'Resource', dataIndex: 'resource', key: 'resource' },
    { title: 'Resource ID', dataIndex: 'resourceId', key: 'resourceId' },
    { title: 'IP Address', dataIndex: 'ipAddress', key: 'ipAddress' },
  ]

  if (error) {
    return <div>{error}</div>
  }

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Audit Log</Title>
      <Space style={{ marginBottom: 16 }}>
        <RangePicker onChange={(dates) => setDateRange(dates)} />
        <Button type="primary" onClick={handleFilter}>Filter</Button>
        <Button onClick={handleExport}>Export to CSV</Button>
      </Space>
      <Table
        columns={columns}
        dataSource={logs}
        loading={loading}
        rowKey="timestamp"
      />
    </div>
  )
}
