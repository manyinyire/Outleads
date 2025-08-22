'use client'

import { useState, useEffect } from 'react'
import { Table, Button, Space, Typography } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import { ColumnsType } from 'antd/es/table'
import Papa from 'papaparse'

const { Title } = Typography

interface DeletedUser {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
  deletedAt: string
}

export default function DeletedUsersPage() {
  const [data, setData] = useState<DeletedUser[]>([])
  const [loading, setLoading] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/users/deleted')
      if (response.ok) {
        const result = await response.json()
        setData(result)
      } else {
        console.error('Failed to fetch deleted users')
      }
    } catch (error) {
      console.error('Error fetching deleted users:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const columns: ColumnsType<DeletedUser> = [
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
    },
    {
      title: 'Creation Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Deletion Date',
      dataIndex: 'deletedAt',
      key: 'deletedAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
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
