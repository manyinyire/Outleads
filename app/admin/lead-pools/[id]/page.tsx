'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Table, Button, Select, Space, Tag, Typography, Card,
  Row, Col, Statistic, App, Upload, Modal, Alert, Divider,
  Progress, Descriptions, Spin
} from 'antd'
import {
  ArrowLeftOutlined, UploadOutlined, UserSwitchOutlined,
  InboxOutlined, CheckCircleOutlined, CloseCircleOutlined
} from '@ant-design/icons'
import Papa from 'papaparse'

const { Title, Text } = Typography
const { Dragger } = Upload

interface Lead {
  id: string
  fullName: string
  phoneNumber: string
  businessSector: { name: string }
  products: Array<{ id: string; name: string }>
  assignedTo: { id: string; name: string } | null
  firstLevelDisposition: { name: string } | null
  secondLevelDisposition: { name: string } | null
  lastCalledAt: string | null
  createdAt: string
}

interface Agent {
  id: string
  name: string
}

interface PoolDetail {
  id: string
  name: string
  campaign: { id: string; campaign_name: string }
  createdBy: { id: string; name: string }
  createdAt: string
  stats: {
    total: number
    assigned: number
    unassigned: number
    called: number
    connected: number
    sales: number
  }
}

interface UploadSummary {
  imported: number
  duplicates: number
  errors: number
  errorDetails: Array<{ row: number; reason: string }>
}

export default function LeadPoolDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { message } = App.useApp()
  const poolId = params.id as string

  const [pool, setPool] = useState<PoolDetail | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [leadsLoading, setLeadsLoading] = useState(false)
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])
  const [selectedAgent, setSelectedAgent] = useState<string | undefined>()
  const [distributing, setDistributing] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 50, total: 0 })

  // Upload modal state
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([])
  const [csvPreview, setCsvPreview] = useState<Record<string, string>[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadSummary, setUploadSummary] = useState<UploadSummary | null>(null)
  const [csvError, setCsvError] = useState<string | null>(null)

  const fetchPool = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth-token')
      const res = await fetch(`/api/admin/lead-pools/${poolId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to fetch')
      const result = await res.json()
      setPool(result.data)
    } catch {
      message.error('Failed to load pool details')
    }
  }, [poolId, message])

  const fetchLeads = useCallback(async (page = 1) => {
    try {
      setLeadsLoading(true)
      const token = localStorage.getItem('auth-token')
      const res = await fetch(
        `/api/admin/lead-pools/${poolId}/leads?page=${page}&limit=50&showAll=${showAll}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      )
      if (!res.ok) throw new Error('Failed to fetch')
      const result = await res.json()
      setLeads(result.data || [])
      setPagination(prev => ({ ...prev, total: result.meta?.total || 0, current: page }))
    } catch {
      message.error('Failed to load leads')
    } finally {
      setLeadsLoading(false)
    }
  }, [poolId, showAll, message])

  const fetchAgents = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth-token')
      const res = await fetch('/api/admin/users?role=AGENT&status=ACTIVE&limit=1000', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to fetch')
      const result = await res.json()
      setAgents(result.data || [])
    } catch {
      message.error('Failed to load agents')
    }
  }, [message])

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await Promise.all([fetchPool(), fetchLeads(1), fetchAgents()])
      setLoading(false)
    }
    init()
  }, [fetchPool, fetchLeads, fetchAgents])

  useEffect(() => {
    fetchLeads(1)
    setSelectedLeads([])
  }, [showAll, fetchLeads])

  const handleDistribute = async () => {
    if (!selectedAgent) {
      message.warning('Please select an agent first')
      return
    }
    if (selectedLeads.length === 0) {
      message.warning('Please select at least one lead')
      return
    }
    try {
      setDistributing(true)
      const token = localStorage.getItem('auth-token')
      const res = await fetch(`/api/admin/lead-pools/${poolId}/distribute`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadIds: selectedLeads, agentId: selectedAgent }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.message || 'Failed to distribute')
      message.success(result.message)
      setSelectedLeads([])
      setSelectedAgent(undefined)
      await Promise.all([fetchPool(), fetchLeads(pagination.current)])
    } catch (err: any) {
      message.error(err.message || 'Failed to distribute leads')
    } finally {
      setDistributing(false)
    }
  }

  const handleFileUpload = (file: File | boolean) => {
    if (typeof file === 'boolean') return false
    setCsvError(null)
    setUploadSummary(null)
    setCsvRows([])
    setCsvPreview([])

    Papa.parse(file as any, {
      header: true,
      skipEmptyLines: true,
      complete: (results: any) => {
        const rows = results.data as Record<string, string>[]
        if (rows.length === 0) {
          setCsvError('The CSV file is empty or has no valid rows.')
          return
        }
        const headers = Object.keys(rows[0])
        const hasName = headers.some(h =>
          ['Full Name', 'full_name', 'name'].includes(h)
        )
        const hasPhone = headers.some(h =>
          ['Phone Number', 'phone_number', 'phone'].includes(h)
        )
        if (!hasName || !hasPhone) {
          setCsvError('CSV must have "Full Name" and "Phone Number" columns.')
          return
        }
        setCsvRows(rows)
        setCsvPreview(rows.slice(0, 5))
      },
      error: () => {
        setCsvError('Failed to parse CSV file. Please check the file format.')
      },
    })
    return false // prevent auto upload
  }

  const handleConfirmUpload = async () => {
    if (csvRows.length === 0) return
    try {
      setUploading(true)
      const token = localStorage.getItem('auth-token')
      const res = await fetch(`/api/admin/lead-pools/${poolId}/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: csvRows }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Upload failed')
      setUploadSummary(result.summary)
      setCsvRows([])
      setCsvPreview([])
      await Promise.all([fetchPool(), fetchLeads(1)])
    } catch (err: any) {
      message.error(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const columns = [
    {
      title: 'Full Name',
      dataIndex: 'fullName',
      key: 'fullName',
    },
    {
      title: 'Phone Number',
      dataIndex: 'phoneNumber',
      key: 'phoneNumber',
    },
    {
      title: 'Sector',
      key: 'sector',
      render: (_: any, r: Lead) => r.businessSector?.name || '-',
    },
    {
      title: 'Products',
      key: 'products',
      render: (_: any, r: Lead) =>
        r.products?.map(p => <Tag key={p.id}>{p.name}</Tag>) || '-',
    },
    {
      title: 'Assigned To',
      key: 'assignedTo',
      render: (_: any, r: Lead) =>
        r.assignedTo ? (
          <Tag color="green">{r.assignedTo.name}</Tag>
        ) : (
          <Tag color="orange">Unassigned</Tag>
        ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: any, r: Lead) => {
        if (r.firstLevelDisposition) {
          return <Tag color="blue">{r.firstLevelDisposition.name}</Tag>
        }
        if (r.lastCalledAt) {
          return <Tag color="purple">Called</Tag>
        }
        return <Tag>Pending</Tag>
      },
    },
  ]

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!pool) return null

  const assignedPct = pool.stats.total > 0
    ? Math.round((pool.stats.assigned / pool.stats.total) * 100)
    : 0

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.push('/admin/lead-pools')}>
          Back
        </Button>
      </Space>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>{pool.name}</Title>
          <Text type="secondary">
            Campaign: <strong>{pool.campaign.campaign_name}</strong> &nbsp;|&nbsp;
            Created by: {pool.createdBy.name} &nbsp;|&nbsp;
            {new Date(pool.createdAt).toLocaleDateString()}
          </Text>
        </div>
        <Button
          type="primary"
          icon={<UploadOutlined />}
          onClick={() => { setUploadModalOpen(true); setUploadSummary(null); setCsvRows([]); setCsvPreview([]); setCsvError(null) }}
        >
          Upload CSV
        </Button>
      </div>

      {/* Stats */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={4}>
          <Card><Statistic title="Total Leads" value={pool.stats.total} /></Card>
        </Col>
        <Col span={4}>
          <Card><Statistic title="Assigned" value={pool.stats.assigned} valueStyle={{ color: '#3f8600' }} /></Card>
        </Col>
        <Col span={4}>
          <Card><Statistic title="Unassigned" value={pool.stats.unassigned} valueStyle={{ color: '#cf1322' }} /></Card>
        </Col>
        <Col span={4}>
          <Card><Statistic title="Called" value={pool.stats.called} /></Card>
        </Col>
        <Col span={4}>
          <Card><Statistic title="Connected" value={pool.stats.connected} /></Card>
        </Col>
        <Col span={4}>
          <Card><Statistic title="Sales" value={pool.stats.sales} valueStyle={{ color: '#3f8600' }} /></Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Text strong>Distribution Progress: </Text>
        <Progress percent={assignedPct} style={{ width: 300 }} />
        <Text type="secondary" style={{ marginLeft: 8 }}>
          {pool.stats.assigned} of {pool.stats.total} leads assigned
        </Text>
      </Card>

      {/* Distribution Controls */}
      {!showAll && (
        <Card style={{ marginBottom: 16 }}>
          <Space size="middle" wrap>
            <Text strong>Assign selected leads to:</Text>
            <Select
              placeholder="Select agent"
              style={{ width: 220 }}
              value={selectedAgent}
              onChange={setSelectedAgent}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={agents.map(a => ({ label: a.name, value: a.id }))}
            />
            <Button
              type="primary"
              icon={<UserSwitchOutlined />}
              onClick={handleDistribute}
              loading={distributing}
              disabled={selectedLeads.length === 0 || !selectedAgent}
            >
              Assign {selectedLeads.length > 0 ? `(${selectedLeads.length})` : ''}
            </Button>
            <Button onClick={() => setShowAll(true)}>View All Leads</Button>
          </Space>
        </Card>
      )}

      {showAll && (
        <Card style={{ marginBottom: 16 }}>
          <Space>
            <Tag color="blue">Showing all leads including assigned</Tag>
            <Button size="small" onClick={() => setShowAll(false)}>Show Unassigned Only</Button>
          </Space>
        </Card>
      )}

      {/* Leads Table */}
      <Table
        columns={columns}
        dataSource={leads}
        rowKey="id"
        loading={leadsLoading}
        rowSelection={
          showAll ? undefined : {
            selectedRowKeys: selectedLeads,
            onChange: (keys) => setSelectedLeads(keys as string[]),
            getCheckboxProps: (record: Lead) => ({
              disabled: record.assignedTo !== null,
            }),
          }
        }
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          onChange: (page) => fetchLeads(page),
          showTotal: (total) => `${total} leads`,
        }}
      />

      {/* Upload CSV Modal */}
      <Modal
        title="Upload Leads from CSV"
        open={uploadModalOpen}
        onCancel={() => setUploadModalOpen(false)}
        footer={null}
        width={700}
        destroyOnHidden
      >
        {uploadSummary ? (
          <div>
            <Alert
              type="success"
              message="Upload Complete"
              description={
                <ul style={{ marginBottom: 0 }}>
                  <li><CheckCircleOutlined style={{ color: 'green' }} /> <strong>{uploadSummary.imported}</strong> leads imported successfully</li>
                  <li><CloseCircleOutlined style={{ color: 'orange' }} /> <strong>{uploadSummary.duplicates}</strong> duplicates skipped</li>
                  {uploadSummary.errors > 0 && (
                    <li><CloseCircleOutlined style={{ color: 'red' }} /> <strong>{uploadSummary.errors}</strong> rows had errors</li>
                  )}
                </ul>
              }
            />
            {uploadSummary.errorDetails.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <Text type="secondary">Error details:</Text>
                <ul>
                  {uploadSummary.errorDetails.map((e, i) => (
                    <li key={i}>Row {e.row}: {e.reason}</li>
                  ))}
                </ul>
              </div>
            )}
            <Button
              type="primary"
              style={{ marginTop: 16 }}
              onClick={() => setUploadModalOpen(false)}
            >
              Done
            </Button>
          </div>
        ) : (
          <div>
            <Alert
              type="info"
              style={{ marginBottom: 16 }}
              message="CSV Format"
              description={
                <span>
                  Required columns: <strong>Full Name</strong>, <strong>Phone Number</strong><br />
                  Optional columns: <strong>Sector</strong>, <strong>Product</strong>
                </span>
              }
            />

            {csvError && (
              <Alert type="error" message={csvError} style={{ marginBottom: 16 }} />
            )}

            <Dragger
              accept=".csv"
              beforeUpload={handleFileUpload}
              showUploadList={false}
              style={{ marginBottom: 16 }}
            >
              <p className="ant-upload-drag-icon"><InboxOutlined /></p>
              <p className="ant-upload-text">Click or drag CSV file here</p>
              <p className="ant-upload-hint">Only .csv files are supported</p>
            </Dragger>

            {csvPreview.length > 0 && (
              <div>
                <Divider>Preview (first 5 rows of {csvRows.length} total)</Divider>
                <Table
                  size="small"
                  dataSource={csvPreview}
                  rowKey={(_, i) => String(i)}
                  columns={Object.keys(csvPreview[0]).map(col => ({
                    title: col,
                    dataIndex: col,
                    key: col,
                    ellipsis: true,
                  }))}
                  pagination={false}
                  scroll={{ x: true }}
                />
                <Space style={{ marginTop: 16 }}>
                  <Button
                    type="primary"
                    onClick={handleConfirmUpload}
                    loading={uploading}
                  >
                    Import {csvRows.length} Leads
                  </Button>
                  <Button onClick={() => { setCsvRows([]); setCsvPreview([]); setCsvError(null) }}>
                    Clear
                  </Button>
                </Space>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
