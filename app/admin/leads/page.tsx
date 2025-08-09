'use client'

import { useEffect, useState } from 'react'
import { Table, Tag, Button, Space, Input, Select, Card, Typography } from 'antd'
import { SearchOutlined, FilterOutlined } from '@ant-design/icons'
import { useLocalStorage } from '@/hooks/useLocalStorage'

const { Title } = Typography
const { Option } = Select

export default function LeadsPage() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [token] = useLocalStorage('token', null)

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const response = await fetch('/api/admin/leads', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        const data = await response.json()
        setLeads(data)
      } catch (error) {
        console.error('Failed to fetch leads:', error)
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      fetchLeads()
    }
  }, [token])

  const filteredLeads = leads.filter((lead: any) => {
    const matchesSearch = lead.name.toLowerCase().includes(searchText.toLowerCase()) ||
                         lead.phone.includes(searchText) ||
                         lead.company.toLowerCase().includes(searchText.toLowerCase())
    return matchesSearch
  })

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: any, b: any) => a.name.localeCompare(b.name),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Company',
      dataIndex: 'company',
      key: 'company',
    },
    {
      title: 'Interested Products',
      dataIndex: 'products',
      key: 'products',
      render: (products: any[]) => (
        <div>
          {products.map((product, index) => (
            <Tag key={index} color="blue" style={{ marginBottom: '4px' }}>
              {product.name}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: 'Campaign Source',
      dataIndex: ['campaign', 'name'],
      key: 'campaignSource',
      render: (campaignName: string) => (
        <div>
          {campaignName ? (
            <Tag color="green">{campaignName}</Tag>
          ) : (
            <Tag color="default">Organic</Tag>
          )}
        </div>
      ),
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
