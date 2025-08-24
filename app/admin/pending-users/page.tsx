'use client'

import { useState, useEffect, useCallback } from 'react'
import { Table, Button, message, Tag } from 'antd'
import { ColumnsType } from 'antd/es/table'
import axios from 'axios'

interface User {
  id: string
  name: string
  email: string
  role: string
  status: string
}

export default function PendingUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPendingUsers = useCallback(async () => {
    setLoading(true)
    try {
      const response = await axios.get('/api/admin/users/pending')
      setUsers(response.data.data)
    } catch (error) {
      message.error('Failed to fetch pending users.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPendingUsers()
  }, [fetchPendingUsers])

  const handleApprove = async (userId: string) => {
    try {
      await axios.post(`/api/admin/users/approve`, { userId })
      message.success('User approved successfully.')
      fetchPendingUsers()
    } catch (error) {
      message.error('Failed to approve user.')
    }
  }

  const columns: ColumnsType<User> = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Requested Role', dataIndex: 'role', key: 'role', render: (role) => <Tag>{role}</Tag> },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button type="primary" onClick={() => handleApprove(record.id)}>
          Approve
        </Button>
      ),
    },
  ]

  return (
    <Table
      dataSource={users}
      columns={columns}
      rowKey="id"
      loading={loading}
      title={() => <h2>Pending User Approvals</h2>}
    />
  )
}
