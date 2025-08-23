'use client'

import { useState, useEffect } from 'react'
import { Modal, Form, Select, Button, message } from 'antd'

const { Option } = Select

interface UserData {
  id: string;
  name: string;
  email: string;
}

interface AddUserProps {
  readonly visible: boolean
  readonly onClose: () => void
  readonly onUserAdded: () => void
}

export default function AddUser({ visible, onClose, onUserAdded }: AddUserProps) {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [allUsersCache, setAllUsersCache] = useState<UserData[]>([])

  // Fetch all users once when the modal becomes visible
  useEffect(() => {
    const fetchAllUsers = async () => {
      if (visible && allUsersCache.length === 0) {
        setLoading(true)
        try {
          const token = localStorage.getItem('auth-token')
          // This endpoint is expected to query the external HRMS API
          const response = await fetch(`/api/admin/users/search?q=`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })

          if (response.ok) {
            const validUsers = data?.filter((user: any) => user?.id && user?.name && user?.email)
            setAllUsersCache(validUsers || [])
          } else {
            message.error('Failed to load the user list from HRMS.')
          }
        } catch (error) {
          console.error('Error fetching all users:', error)
          message.error('An error occurred while fetching the user list.')
        } finally {
          setLoading(false)
        }
      }
    }

    fetchAllUsers()
  }, [visible, allUsersCache.length])

  const handleAddUser = async (values: { userId: string; role: string }) => {
    try {
      const selectedUser = allUsersCache.find(u => u.id === values.userId);
      if (!selectedUser) {
        message.error("Invalid user selected. Please try again.");
        return;
      }

      const token = localStorage.getItem('auth-token')
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: selectedUser.name,
          email: selectedUser.email,
          username: selectedUser.name, // Assuming username can be the same as name
          role: values.role,
        }),
      })

      if (response.ok) {
        message.success('User added successfully')
        onUserAdded()
        onClose()
        form.resetFields()
      } else {
        const error = await response.json()
        message.error(error.message || 'Failed to add user')
      }
    } catch (error) {
      console.error('Error adding user:', error)
      message.error('An error occurred while adding the user.')
    }
  }

  return (
    <Modal
      title="Add New User"
      open={visible}
      onCancel={onClose}
      footer={null}
    >
      <Form form={form} layout="vertical" onFinish={handleAddUser}>
        <Form.Item
          name="userId"
          label="Search HRMS Users"
          rules={[{ required: true, message: 'Please select a user' }]}
        >
          <Select
            showSearch
            placeholder="Search by name or email..."
            loading={loading}
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
          >
            {allUsersCache.map(user => (
              <Option key={user.id} value={user.id} label={`${user.name} (${user.email})`}>
                {`${user.name} (${user.email})`}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="role"
          label="Role"
          rules={[{ required: true, message: 'Please select a role' }]}
        >
          <Select placeholder="Select a role">
            <Option value="ADMIN">Admin</Option>
            <Option value="BSS">BSS</Option>
            <Option value="INFOSEC">InfoSec</Option>
            <Option value="AGENT">Agent</Option>
            <Option value="TEAMLEADER">Teamleader</Option>
          </Select>
        </Form.Item>

        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
          <Button onClick={onClose} style={{ marginRight: 8 }}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit">
            Add User
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  )
}