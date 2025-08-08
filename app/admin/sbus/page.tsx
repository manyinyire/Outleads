'use client'

import { Table, Card, Typography, Tag, Button, Space } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'

const { Title } = Typography

export default function SBUsPage() {
  const sbus = [
    {
      key: '1',
      name: 'Corporate Banking',
      code: 'CB001',
      manager: 'John Smith',
      status: 'active',
      leadCount: 45,
    },
    {
      key: '2',
      name: 'SME Finance',
      code: 'SME001',
      manager: 'Sarah Johnson',
      status: 'active',
      leadCount: 32,
    },
    {
      key: '3',
      name: 'Investment Services',
      code: 'INV001',
      manager: 'Mike Wilson',
      status: 'active',
      leadCount: 28,
    },
  ]

  const columns = [
    {
      title: 'SBU Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: 'Manager',
      dataIndex: 'manager',
      key: 'manager',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Lead Count',
      dataIndex: 'leadCount',
      key: 'leadCount',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: () => (
        <Space>
          <Button type="text" icon={<EditOutlined />} size="small" />
          <Button type="text" icon={<DeleteOutlined />} size="small" danger />
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Title level={2}>Strategic Business Units</Title>
        <Button type="primary" icon={<PlusOutlined />}>
          Add SBU
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={sbus}
          rowKey="key"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
        />
      </Card>
    </div>
  )
}
