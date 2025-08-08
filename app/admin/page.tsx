'use client'

import { Row, Col, Card, Statistic, Typography, Table, Tag } from 'antd'
import { UserOutlined, BulbOutlined, TrophyOutlined, DollarOutlined } from '@ant-design/icons'

const { Title } = Typography

export default function AdminDashboard() {
  const recentLeads = [
    {
      key: '1',
      name: 'John Smith',
      company: 'TechCorp Solutions',
      campaign: 'TechCorp Campaign',
      status: 'new',
      createdAt: '2024-01-15',
    },
    {
      key: '2',
      name: 'Sarah Johnson',
      company: 'HealthPlus Medical',
      campaign: 'HealthPlus Campaign',
      status: 'contacted',
      createdAt: '2024-01-14',
    },
    {
      key: '3',
      name: 'Mike Wilson',
      company: 'Direct Lead',
      campaign: 'Organic',
      status: 'qualified',
      createdAt: '2024-01-13',
    },
  ]

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Company',
      dataIndex: 'company',
      key: 'company',
    },
    {
      title: 'Campaign',
      dataIndex: 'campaign',
      key: 'campaign',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors = {
          new: 'blue',
          contacted: 'orange',
          qualified: 'green',
          converted: 'purple',
        }
        return <Tag color={colors[status as keyof typeof colors]}>{status.toUpperCase()}</Tag>
      },
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
  ]

  return (
    <div>
      <Title level={2} style={{ marginBottom: '24px' }}>
        Dashboard Overview
      </Title>

      <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Leads"
              value={156}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Campaigns"
              value={8}
              prefix={<BulbOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Conversion Rate"
              value={18.5}
              suffix="%"
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Revenue Pipeline"
              value={2.4}
              prefix={<DollarOutlined />}
              suffix="M"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="Recent Leads"
        style={{ marginBottom: '24px' }}
      >
        <Table
          columns={columns}
          dataSource={recentLeads}
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  )
}
