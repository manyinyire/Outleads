'use client'

import { useState, useEffect } from 'react'
import { Table, Button, Typography, App } from 'antd'
import { DownloadOutlined, UndoOutlined } from '@ant-design/icons'
import { ColumnsType } from 'antd/es/table'
import Papa from 'papaparse'

const { Title } = Typography

interface DeletedUser {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
  updatedAt: string
}

export default function DeletedUsersPage() {
  const [data, setData] = useState<DeletedUser[]>([])
  const [loading, setLoading] = useState(false)
  const { message } = App.useApp()

  const fetchData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/admin/users/deleted', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const result = await response.json()
        setData(result.data)
      } else {
        message.error('Failed to fetch deleted users')
      }
    } catch (error) {
      console.error('Error fetching deleted users:', error)
      message.error('An error occurred while fetching deleted users.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleRestore = async (userId: string) => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/admin/users/${userId}/restore`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        message.success('User restored successfully');
        fetchData(); // Refresh the list
      } else {
        const error = await response.json();
        message.error(error.message || 'Failed to restore user');
      }
    } catch (error) {
      console.error('Error restoring user:', error);
      message.error('An error occurred while restoring the user.');
    }
  };

  const columns: ColumnsType<DeletedUser> = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Role', dataIndex: 'role', key: 'role' },
    { title: 'Creation Date', dataIndex: 'createdAt', key: 'createdAt', render: (date: string) => new Date(date).toLocaleDateString() },
    { title: 'Deletion Date', dataIndex: 'updatedAt', key: 'updatedAt', render: (date: string) => new Date(date).toLocaleDateString() },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="link"
          icon={<UndoOutlined />}
          onClick={() => handleRestore(record.id)}
        >
          Restore
        </Button>
      ),
    },
  ]

  const handleExport = () => {
    const csv = Papa.unparse(data)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'deleted-users.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2}>Deleted Users</Title>
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={handleExport}
        >
          Export to CSV
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
      />
    </div>
  )
}
