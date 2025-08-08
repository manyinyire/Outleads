'use client'

import { Table, Card, Typography, Tag, Button, Space } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'

const { Title } = Typography

export default function UsersPage() {
  const users = [
    {
      key: '1',
      name: 'Admin User',
      email: 'admin@nexus.com',
      role: 'admin',
      status: 'active',
      lastLogin: '2024-01-15',
    },
    {
      key: '2',
      name: 'John Manager',
      email: 'john@nexus.com',
      role: 'manager',
      status: 'active',
      lastLogin: '2024-01-14',
    },
    {
      key: '3',
      name: 'Sarah Agent',
      email: 'sarah@nexus.com',
      role: 'user',
      status: 'active',
      lastLogin: '2024-01-13',
    },
  ]

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        const colors = {
          admin: 'red',
          manager: 'blue',
          user: 'green',
        }
        return <Tag color={colors[role as keyof typeof colors]}>{role.toUpperCase()}</Tag>
      },
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
      title: 'Last Login',
      dataIndex: 'lastLogin',
      key: 'lastLogin',
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
        <Title level={2}>User Management</Title>
        <Button type="primary" icon={<PlusOutlined />}>
          Add User
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={users}
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
