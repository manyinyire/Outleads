'use client'

import { useEffect, useState } from 'react'
import { Table, Tag, Button, Space, Input, Select, Card, Typography, Alert } from 'antd'
import { SearchOutlined, FilterOutlined } from '@ant-design/icons'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/store'

const { Title } = Typography
const { Option } = Select

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const { isAuthenticated } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    const fetchLeads = async (status = '') => {
      try {
        setError(null)
        // Don't send Authorization header - let the auth middleware handle the HTTP-only cookie
        const url = status ? `/api/admin/leads?status=${status}` : '/api/admin/leads';
        const response = await fetch(url, {
          credentials: 'include', // Include cookies in the request
        })
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        console.log('Fetched leads:', data) // Debug log
        setLeads(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('Failed to fetch leads:', error)
        setError(error instanceof Error ? error.message : 'Failed to fetch leads')
        setLeads([])
      } finally {
        setLoading(false)
      }
    }

    if (isAuthenticated) {
      fetchLeads(statusFilter);
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, statusFilter]);

  const filteredLeads = leads.filter((lead: any) => {
    const searchTextLower = searchText.toLowerCase();
    return (
      lead.name.toLowerCase().includes(searchTextLower) ||
      lead.phone.includes(searchText) ||
      lead.company.toLowerCase().includes(searchTextLower)
    );
  });

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: any, b: any) => a.name.localeCompare(b.name),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'default';
        if (status === 'NEW') color = 'blue';
        if (status === 'INTERESTED') color = 'cyan';
        if (status === 'CONTACTED') color = 'orange';
        if (status === 'QUALIFIED') color = 'purple';
        if (status === 'CONVERTED') color = 'green';
        return <Tag color={color}>{status}</Tag>;
      },
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

      {error && (
        <Alert
          message="Error Loading Leads"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: '24px' }}
        />
      )}

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
            <Option value="NEW">New</Option>
            <Option value="INTERESTED">Interested</Option>
            <Option value="CONTACTED">Contacted</Option>
            <Option value="QUALIFIED">Qualified</Option>
            <Option value="CONVERTED">Converted</Option>
          </Select>
          <Button 
            onClick={() => window.location.reload()} 
            loading={loading}
          >
            Refresh
          </Button>
          <Button 
            onClick={async () => {
              setLoading(true);
              try {
                const url = statusFilter ? `/api/admin/leads?status=${statusFilter}` : '/api/admin/leads';
                const response = await fetch(url, {
                  credentials: 'include',
                });
                const data = await response.json();
                console.log('Manual fetch result:', { status: response.status, data });
                if (response.ok) {
                  setLeads(Array.isArray(data) ? data : []);
                  setError(null);
                } else {
                  setError(data.message || 'Failed to fetch leads');
                }
              } catch (err) {
                console.error('Manual fetch error:', err);
                setError(err instanceof Error ? err.message : 'Network error');
              } finally {
                setLoading(false);
              }
            }}
            loading={loading}
          >
            Manual Fetch
          </Button>
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
