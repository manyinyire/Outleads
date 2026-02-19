'use client'

import { useState, useMemo } from 'react'
import { App, Tag, Row, Col, Select, DatePicker, Button, Modal, Tooltip } from 'antd'
import { ColumnsType } from 'antd/es/table'
import CrudTable from '@/components/admin/shared/CrudTable'
import CallLeadModal from '@/components/admin/CallLeadModal'
import AssignCampaignModal from '@/components/admin/AssignCampaignModal'
import { PhoneOutlined, UserSwitchOutlined, LinkOutlined } from '@ant-design/icons'
import api from '@/lib/api/api'
import { useLeads } from '@/hooks/useLeads'
import { sanitizeText } from '@/lib/utils/sanitization'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/store'

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

  const [isCallModalVisible, setCallModalVisible] = useState(false)
  const [isAssignModalVisible, setAssignModalVisible] = useState(false)
  const [isAssignCampaignModalVisible, setAssignCampaignModalVisible] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [selectedLeads, setSelectedLeads] = useState<React.Key[]>([])
  const [selectedAgent, setSelectedAgent] = useState<string | undefined>(undefined)
  const { message } = App.useApp()
  const userRole = useSelector((state: RootState) => state.auth.user?.role)

  const handleCall = (record: Lead) => {
    setSelectedLead(record)
    setCallModalVisible(true)
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
      title: 'Contact Status',
      key: 'firstLevelDisposition',
      render: (_, record: any) => {
        const disposition = record.firstLevelDisposition;
        if (!disposition) return <Tag>Not Set</Tag>;
        return (
          <Tag color={disposition.name === 'Contacted' ? 'green' : 'orange'}>
            {sanitizeText(disposition.name)}
          </Tag>
        );
      }
    },
    {
      title: 'Sale Status',
      key: 'secondLevelDisposition',
      render: (_, record: any) => {
        const disposition = record.secondLevelDisposition;
        if (!disposition) return '-';
        return (
          <Tag color={disposition.name === 'Sale' ? 'green' : 'red'}>
            {sanitizeText(disposition.name)}
          </Tag>
        );
      }
    },
    {
      title: 'Last Called',
      dataIndex: 'lastCalledAt',
      key: 'lastCalledAt',
      render: (date: string) => {
        if (!date) return <Tag color="default">Never</Tag>;
        return <span>{new Date(date).toLocaleString()}</span>;
      },
      sorter: true
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
        <>
          <Button type="link" icon={<PhoneOutlined />} onClick={() => handleCall(record)}>
            Call
          </Button>
        </>
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
          <Select.Option value="direct">Direct Lead</Select.Option>
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
        <Select
          placeholder="Call Status"
          style={{ width: 180 }}
          onChange={(value) => handleFilterChange('callStatus', value)}
          value={filters.callStatus}
          allowClear
        >
          <Select.Option value="called">Called</Select.Option>
          <Select.Option value="not_called">Not Called</Select.Option>
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
              <>
                {userRole && ['ADMIN', 'SUPERVISOR'].includes(userRole) && (
                  <Button
                    type="primary"
                    icon={<UserSwitchOutlined />}
                    onClick={() => setAssignModalVisible(true)}
                    style={{ marginBottom: 16, marginRight: 8 }}
                  >
                    Assign to Agent
                  </Button>
                )}
                <Button
                  type="default"
                  icon={<LinkOutlined />}
                  onClick={() => setAssignCampaignModalVisible(true)}
                  style={{ marginBottom: 16 }}
                >
                  Assign to Campaign
                </Button>
              </>
            )}
          </>
        }
        hideDefaultActions={true}
        rowSelection={rowSelection}
      />
      <CallLeadModal
        lead={selectedLead}
        visible={isCallModalVisible}
        onClose={() => {
          setCallModalVisible(false)
          setSelectedLead(null)
        }}
        onSuccess={() => {
          fetchData()
        }}
      />
      <AssignCampaignModal
        visible={isAssignCampaignModalVisible}
        leadIds={selectedLeads as string[]}
        leadCount={selectedLeads.length}
        onClose={() => {
          setAssignCampaignModalVisible(false)
        }}
        onSuccess={() => {
          setSelectedLeads([])
          fetchData()
        }}
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