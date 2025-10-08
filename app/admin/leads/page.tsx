'use client'

import { useState, useMemo } from 'react'
import { App, Tag, Row, Col, Select, DatePicker, Button, Modal } from 'antd'
import { ColumnsType } from 'antd/es/table'
import CrudTable from '@/components/admin/shared/CrudTable'
import LeadDetailModal from '@/components/admin/leads/LeadDetailModal'
import { EyeOutlined, UserSwitchOutlined } from '@ant-design/icons'
import api from '@/lib/api/api'
import { useLeads } from '@/hooks/useLeads'
import { sanitizeText } from '@/lib/utils/sanitization'

const { RangePicker } = DatePicker

interface Lead {
  id: string
  fullName: string
  phoneNumber: string
  businessSector: { name: string }
  products: Array<{ id: string, name: string }>
  campaign?: { id: string, campaign_name: string }
  assignedTo?: { name: string }
  createdAt: string
}

export default function LeadsPage() {
  const {
    data,
    loading,
    pagination,
    filters,
    filterData,
    fetchData,
    handleTableChange,
    handleFilterChange,
    clearFilters,
    handleSearch,
  } = useLeads()

  const [isViewModalVisible, setViewModalVisible] = useState(false)
  const [isAssignModalVisible, setAssignModalVisible] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [selectedLeads, setSelectedLeads] = useState<React.Key[]>([])
  const [selectedAgent, setSelectedAgent] = useState<string | undefined>(undefined)
  const { message } = App.useApp()

  const handleView = (record: Lead) => {
    setSelectedLead(record)
    setViewModalVisible(true)
  }

  const handleAssign = async () => {
    if (!selectedAgent) {
      message.error('Please select an agent.')
      return
    }
    try {
      await api.post('/admin/leads/assign', {
        leadIds: selectedLeads,
        agentId: selectedAgent,
      })
      message.success('Leads assigned successfully.')
      setAssignModalVisible(false)
      setSelectedLeads([])
      fetchData() // Refetch data after assignment
    } catch (error) {
      console.error("Assign error:", error)
      message.error('Failed to assign leads.')
    }
  }

  const columns: ColumnsType<Lead> = useMemo(() => [
    { 
      title: 'Name', 
      dataIndex: 'fullName', 
      key: 'fullName',
      render: (name: string) => sanitizeText(name || '')
    },
    { 
      title: 'Phone', 
      dataIndex: 'phoneNumber', 
      key: 'phoneNumber',
      render: (phone: string) => sanitizeText(phone || '')
    },
    { 
      title: 'Sector', 
      dataIndex: ['businessSector', 'name'], 
      key: 'sector',
      render: (name: string) => sanitizeText(name || '')
    },
    {
      title: 'Products',
      dataIndex: 'products',
      key: 'products',
      render: (products: Array<{ name: string }>) => (
        <>
          {products.map(p => <Tag key={p.name}>{sanitizeText(p.name)}</Tag>)}
        </>
      ),
    },
    { 
      title: 'Campaign', 
      dataIndex: 'campaign', 
      key: 'campaign',
      render: (campaign) => campaign ? <Tag color="blue">{sanitizeText(campaign.campaign_name)}</Tag> : <Tag>Direct Lead</Tag>
    },
    { 
      title: 'Assigned Agent', 
      dataIndex: ['assignedTo', 'name'], 
      key: 'assignedTo',
      render: (name: string) => sanitizeText(name || '')
    },
    { title: 'Date', dataIndex: 'createdAt', key: 'createdAt', render: (date) => new Date(date).toLocaleDateString() },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => handleView(record)}>
          View
        </Button>
      ),
    },
  ], [])

  const filterOptions = (
    <Row gutter={16} style={{ marginBottom: 16 }}>
      <Col>
        <Select
          placeholder="Filter by Product"
          style={{ width: 200 }}
          onChange={(value) => handleFilterChange('productId', value)}
          value={filters.productId}
          allowClear
        >
          {filterData.products.map(p => <Select.Option key={p.id} value={p.id}>{sanitizeText(p.name)}</Select.Option>)}
        </Select>
      </Col>
      <Col>
        <Select
          placeholder="Filter by Campaign"
          style={{ width: 200 }}
          onChange={(value) => handleFilterChange('campaignId', value)}
          value={filters.campaignId}
          allowClear
        >
          {filterData.campaigns.map(c => <Select.Option key={c.id} value={c.id}>{sanitizeText(c.campaign_name)}</Select.Option>)}
        </Select>
      </Col>
      <Col>
        <Select
          placeholder="Filter by Sector"
          style={{ width: 200 }}
          onChange={(value) => handleFilterChange('sectorId', value)}
          value={filters.sectorId}
          allowClear
        >
          {filterData.sectors.map(s => <Select.Option key={s.id} value={s.id}>{sanitizeText(s.name)}</Select.Option>)}
        </Select>
      </Col>
      <Col>
        <RangePicker 
          onChange={(dates) => handleFilterChange('dateRange', dates)}
          value={filters.dateRange as any}
        />
      </Col>
      <Col>
        <Button onClick={clearFilters}>Clear Filters</Button>
      </Col>
    </Row>
  )

  const rowSelection = {
    onChange: (selectedRowKeys: React.Key[]) => {
      setSelectedLeads(selectedRowKeys)
    },
  }

  return (
    <>
      <CrudTable<Lead>
        title="Lead Management"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={pagination}
        onTableChange={handleTableChange}
        onSearch={handleSearch}
        customHeader={
          <>
            {filterOptions}
            {selectedLeads.length > 0 && (
              <Button
                type="primary"
                icon={<UserSwitchOutlined />}
                onClick={() => setAssignModalVisible(true)}
                style={{ marginBottom: 16 }}
              >
                Assign to Agent
              </Button>
            )}
          </>
        }
        hideDefaultActions={true}
        rowSelection={rowSelection}
      />
      <LeadDetailModal
        lead={selectedLead}
        visible={isViewModalVisible}
        onClose={() => setViewModalVisible(false)}
      />
      <Modal
        title="Assign Leads to Agent"
        open={isAssignModalVisible}
        onOk={handleAssign}
        onCancel={() => setAssignModalVisible(false)}
      >
        <Select
          placeholder="Select an agent"
          style={{ width: '100%' }}
          onChange={(value) => setSelectedAgent(value)}
          value={selectedAgent}
        >
          {filterData.agents.map(agent => (
            <Select.Option key={agent.id} value={agent.id}>
              {sanitizeText(agent.name)}
            </Select.Option>
          ))}
        </Select>
      </Modal>
    </>
  )
}