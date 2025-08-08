'use client'

import { useEffect, useState } from 'react'
import { Table, Tag, Button, Space, Input, Select, Card, Typography } from 'antd'
import { SearchOutlined, FilterOutlined } from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { RootState, AppDispatch } from '@/lib/store'
import { fetchLeads, updateLeadStatus } from '@/lib/store/slices/leadSlice'

const { Title } = Typography
const { Option } = Select

export default function LeadsPage() {
  const dispatch = useDispatch<AppDispatch>()
  const { leads, loading } = useSelector((state: RootState) => state.lead)
  
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  useEffect(() => {
    dispatch(fetchLeads())
  }, [dispatch])

  const handleStatusChange = (leadId: string, newStatus: string) => {
    dispatch(updateLeadStatus({ id: leadId, status: newStatus as any }))
  }

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.fullName.toLowerCase().includes(searchText.toLowerCase()) ||
                         lead.phoneNumber.includes(searchText) ||
                         lead.businessSector.toLowerCase().includes(searchText.toLowerCase())
    const matchesStatus = !statusFilter || lead.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const columns = [
    {
      title: 'Name',
      dataIndex: 'fullName',
      key: 'fullName',
      sorter: (a: any, b: any) => a.fullName.localeCompare(b.fullName),
    },
    {
      title: 'Phone',
      dataIndex: 'phoneNumber',
      key: 'phoneNumber',
    },
    {
      title: 'Business Sector',
      dataIndex: 'businessSector',
      key: 'businessSector',
      filters: [
        { text: 'Technology', value: 'Technology' },
        { text: 'Healthcare', value: 'Healthcare' },
        { text: 'Manufacturing', value: 'Manufacturing' },
        { text: 'Retail', value: 'Retail' },
      ],
      onFilter: (value: any, record: any) => record.businessSector === value,
    },
    {
      title: 'Interested Products',
      dataIndex: 'interestedProducts',
      key: 'interestedProducts',
      render: (products: string[]) => (
        <div>
          {products.map((product, index) => (
            <Tag key={index} color="blue" style={{ marginBottom: '4px' }}>
              {product}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: 'Campaign Source',
      key: 'campaignSource',
      render: (record: any) => (
        <div>
          {record.campaignName ? (
            <Tag color="green">{record.campaignName}</Tag>
          ) : (
            <Tag color="default">Organic</Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: any) => {
        const colors = {
          new: 'blue',
          contacted: 'orange',
          qualified: 'green',
          converted: 'purple',
        }
        return (
          <Select
            value={status}
            style={{ width: 120 }}
            onChange={(value) => handleStatusChange(record.id, value)}
          >
            <Option value="new">
              <Tag color="blue">NEW</Tag>
            </Option>
            <Option value="contacted">
              <Tag color="orange">CONTACTED</Tag>
            </Option>
            <Option value="qualified">
              <Tag color="green">QUALIFIED</Tag>
            </Option>
            <Option value="converted">
              <Tag color="purple">CONVERTED</Tag>
            </Option>
          </Select>
        )
      },
    },
    {
      title: 'Created Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
      sorter: (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
  ]

  return (
    <div>
      <Title level={2} style={{ marginBottom: '24px' }}>
        Lead Management
      </Title>

      <Card style={{ marginBottom: '24px' }}>
        <Space style={{ marginBottom: '16px' }}>
          <Input
            placeholder="Search leads..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
          />
          <Select
            placeholder="Filter by status"
            style={{ width: 150 }}
            value={statusFilter}
            onChange={setStatusFilter}
            allowClear
          >
            <Option value="new">New</Option>
            <Option value="contacted">Contacted</Option>
            <Option value="qualified">Qualified</Option>
            <Option value="converted">Converted</Option>
          </Select>
        </Space>

        <Table
          columns={columns}
          dataSource={filteredLeads}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} leads`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  )
}
