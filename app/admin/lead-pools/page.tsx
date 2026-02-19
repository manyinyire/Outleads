'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Table, Button, Modal, Form, Input, Select, Tag, Space,
  Typography, Card, Row, Col, Statistic, App, Progress
} from 'antd'
import { PlusOutlined, InboxOutlined, EyeOutlined } from '@ant-design/icons'
import api from '@/lib/api/api'

const { Title, Text } = Typography

interface Campaign {
  id: string
  campaign_name: string
}

interface LeadPool {
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

export default function LeadPoolsPage() {
  const router = useRouter()
  const { message } = App.useApp()

  const [pools, setPools] = useState<LeadPool[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form] = Form.useForm()

  const fetchPools = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.get('/admin/lead-pools')
      setPools(res.data.data || [])
    } catch {
      message.error('Failed to load lead pools')
    } finally {
      setLoading(false)
    }
  }, [message])

  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await api.get('/admin/campaigns?limit=1000')
      setCampaigns(
        (res.data.data || []).filter((c: any) => c.is_active)
      )
    } catch {
      message.error('Failed to load campaigns')
    }
  }, [message])

  useEffect(() => {
    fetchPools()
    fetchCampaigns()
  }, [fetchPools, fetchCampaigns])

  const handleCreate = async (values: { name: string; campaignId: string }) => {
    try {
      setCreating(true)
      await api.post('/admin/lead-pools', values)
      message.success('Lead pool created successfully')
      setCreateModalOpen(false)
      form.resetFields()
      fetchPools()
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Failed to create lead pool')
    } finally {
      setCreating(false)
    }
  }

  const columns = [
    {
      title: 'Pool Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: 'Campaign',
      key: 'campaign',
      render: (_: any, record: LeadPool) => (
        <Tag color="blue">{record.campaign.campaign_name}</Tag>
      ),
    },
    {
      title: 'Total Leads',
      key: 'total',
      render: (_: any, record: LeadPool) => record.stats.total,
    },
    {
      title: 'Distribution Progress',
      key: 'progress',
      render: (_: any, record: LeadPool) => {
        const pct = record.stats.total > 0
          ? Math.round((record.stats.assigned / record.stats.total) * 100)
          : 0
        return (
          <Space direction="vertical" size={0} style={{ width: 160 }}>
            <Progress percent={pct} size="small" />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.stats.assigned} assigned / {record.stats.unassigned} pending
            </Text>
          </Space>
        )
      },
    },
    {
      title: 'Called',
      key: 'called',
      render: (_: any, record: LeadPool) => record.stats.called,
    },
    {
      title: 'Connected',
      key: 'connected',
      render: (_: any, record: LeadPool) => record.stats.connected,
    },
    {
      title: 'Sales',
      key: 'sales',
      render: (_: any, record: LeadPool) => record.stats.sales,
    },
    {
      title: 'Created By',
      key: 'createdBy',
      render: (_: any, record: LeadPool) => record.createdBy.name,
    },
    {
      title: 'Date',
      key: 'createdAt',
      render: (_: any, record: LeadPool) =>
        new Date(record.createdAt).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: LeadPool) => (
        <Button
          type="primary"
          icon={<EyeOutlined />}
          size="small"
          onClick={() => router.push(`/admin/lead-pools/${record.id}`)}
        >
          Manage
        </Button>
      ),
    },
  ]

  const totalLeads = pools.reduce((s, p) => s + p.stats.total, 0)
  const totalAssigned = pools.reduce((s, p) => s + p.stats.assigned, 0)
  const totalUnassigned = pools.reduce((s, p) => s + p.stats.unassigned, 0)
  const totalSales = pools.reduce((s, p) => s + p.stats.sales, 0)

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          <InboxOutlined style={{ marginRight: 8 }} />
          Lead Pools
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCreateModalOpen(true)}
        >
          New Pool
        </Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic title="Total Pools" value={pools.length} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Total Leads" value={totalLeads} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Assigned" value={totalAssigned} valueStyle={{ color: '#3f8600' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Pending Assignment" value={totalUnassigned} valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={pools}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 20 }}
      />

      <Modal
        title="Create New Lead Pool"
        open={createModalOpen}
        onCancel={() => { setCreateModalOpen(false); form.resetFields() }}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            name="name"
            label="Pool Name"
            rules={[{ required: true, message: 'Please enter a pool name' }]}
          >
            <Input placeholder="e.g. February Batch - Harare" />
          </Form.Item>
          <Form.Item
            name="campaignId"
            label="Campaign"
            rules={[{ required: true, message: 'Please select a campaign' }]}
          >
            <Select
              showSearch
              placeholder="Select an existing campaign"
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={campaigns.map(c => ({ label: c.campaign_name, value: c.id }))}
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={creating}>
                Create Pool
              </Button>
              <Button onClick={() => { setCreateModalOpen(false); form.resetFields() }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
