'use client'

import { useState, useMemo } from 'react'
import { Tag, Button, Space, App, Popconfirm } from 'antd'
import { ColumnsType } from 'antd/es/table'
import { DownloadOutlined, DeleteOutlined, UserAddOutlined, EditOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
// @ts-ignore - papaparse types not available
import Papa from 'papaparse'

import CrudTable, { CrudField } from '@/components/admin/shared/CrudTable'
import AddUser from '@/components/admin/AddUser'
import { apiClient } from '@/lib/api/api-client'

interface User {
  id: string
  name: string
  email: string
  role: string
  status: string
  createdAt: string
}

export default function UsersTable() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [isModalVisible, setModalVisible] = useState(false)

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['admin-users'],
    queryFn: () => apiClient.get('/admin/users'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/users/${id}`),
    onSuccess: () => {
      message.success('User deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: () => {
      message.error('Failed to delete user')
    },
  })

  const columns: ColumnsType<User> = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Role', dataIndex: 'role', key: 'role' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'geekblue'
        if (status === 'ACTIVE') color = 'green'
        if (status === 'INACTIVE') color = 'volcano'
        return <Tag color={color}>{status.toUpperCase()}</Tag>
      },
    },
    { title: 'Created At', dataIndex: 'createdAt', key: 'createdAt', render: (date: string) => new Date(date).toLocaleDateString() },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />}>
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this user?"
            onConfirm={() => deleteMutation.mutate(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const fields: CrudField[] = [
    { name: 'name', label: 'Name', required: true },
    { name: 'email', label: 'Email', required: true },
    { name: 'password', label: 'Password', required: true, type: 'password' },
    {
      name: 'role',
      label: 'Role',
      required: true,
      type: 'select',
      options: [
        { label: 'Admin', value: 'ADMIN' },
        { label: 'Agent', value: 'AGENT' },
      ],
    },
  ]

  const handleExport = () => {
    if (users) {
      const csv = Papa.unparse(users)
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.setAttribute('download', 'users.csv')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleUserAdded = () => {
    setModalVisible(false);
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
  };

  return (
    <>
      <CrudTable<User>
        title="Users"
        columns={columns}
        dataSource={users || []}
        loading={isLoading}
        fields={fields}
        customActions={
          <Space>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>
              Export
            </Button>
            <Button type="primary" icon={<UserAddOutlined />} onClick={() => setModalVisible(true)}>
              Add User
            </Button>
          </Space>
        }
      />
      <AddUser visible={isModalVisible} onClose={() => setModalVisible(false)} onUserAdded={handleUserAdded} />
    </>
  )
}