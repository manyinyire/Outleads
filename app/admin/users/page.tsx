'use client'

import { useState } from 'react'
import { Input, Button, Table, Modal, Form, Select, message, Card, Typography } from 'antd'
import { UserOutlined } from '@ant-design/icons'

const { Title } = Typography
const { Option } = Select

export default function UsersPage() {
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState([])
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [form] = Form.useForm()

  const handleSearch = async (username: string) => {
    if (!username) return
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/users/search?username=${username}`)
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      } else {
        message.error('Failed to search for users')
      }
    } catch (error) {
      message.error('An error occurred while searching for users')
    } finally {
      setLoading(false)
    }
  }

  const handleAddUser = (user: any) => {
    setSelectedUser(user)
    setIsModalVisible(true)
  }

  const handleModalOk = async (values: { role: string }) => {
    if (!selectedUser) return

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...selectedUser, role: values.role }),
        credentials: 'include',
      })

      if (response.ok) {
        message.success('User added successfully')
        setIsModalVisible(false)
        form.resetFields()
      } else {
        const error = await response.json()
        message.error(error.message || 'Failed to add user')
      }
    } catch (error) {
      message.error('An unexpected error occurred')
    }
  }

  const columns = [
    { title: 'First Name', dataIndex: 'first_name', key: 'first_name' },
    { title: 'Last Name', dataIndex: 'last_name', key: 'last_name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Department', dataIndex: 'department', key: 'department' },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: any) => (
        <Button type="primary" onClick={() => handleAddUser(record)}>
          Add User
        </Button>
      ),
    },
  ]

  return (
    <Card>
      <Title level={2}>User Management</Title>
      <Input.Search
        placeholder="Search for a user by username"
        enterButton="Search"
        size="large"
        onSearch={handleSearch}
        loading={loading}
        prefix={<UserOutlined />}
      />
      <Table columns={columns} dataSource={users} rowKey="username" style={{ marginTop: '20px' }} />

      <Modal
        title="Add User"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
      >
        {selectedUser && (
          <div>
            <p><strong>First Name:</strong> {selectedUser.first_name}</p>
            <p><strong>Last Name:</strong> {selectedUser.last_name}</p>
            <p><strong>Email:</strong> {selectedUser.email}</p>
            <p><strong>Department:</strong> {selectedUser.department}</p>
            <Form form={form} onFinish={handleModalOk} layout="vertical">
              <Form.Item name="role" label="Role" rules={[{ required: true, message: 'Please select a role' }]}>
                <Select placeholder="Select a role">
                  <Option value="BSS">BSS</Option>
                  <Option value="ADMIN">Admin</Option>
                  <Option value="INFOSEC">InfoSec</Option>
                </Select>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </Card>
  )
}