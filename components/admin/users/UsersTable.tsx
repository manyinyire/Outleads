'use client'

import { useState, useMemo } from 'react'
import { Tag, Button, Space, App, Popconfirm } from 'antd'
import { ColumnsType } from 'antd/es/table'
import { DownloadOutlined, DeleteOutlined, UserAddOutlined, EditOutlined, StopOutlined } from '@ant-design/icons'
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
  lastLogin?: string
}

export default function UsersTable() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [isModalVisible, setModalVisible] = useState(false)

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['admin-users'],
    queryFn: () => apiClient.get('/admin/users'),
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: string }) => apiClient.put(`/admin/users/${id}`, { status }),
    onSuccess: () => {
      message.success('User status updated successfully')
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: () => {
      message.error('Failed to update user status')
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
    { title: 'Last Login', dataIndex: 'lastLogin', key: 'lastLogin', render: (date?: string) => date ? new Date(date).toLocaleString() : 'Never' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />}>
            Edit
          </Button>
          {record.status === 'ACTIVE' && (
            <Popconfirm
              title="Are you sure you want to disable this user?"
              onConfirm={() => updateStatusMutation.mutate({ id: record.id, status: 'INACTIVE' })}
              okText="Yes"
              cancelText="No"
            >
              <Button type="link" danger icon={<StopOutlined />}>
                Disable
              </Button>
            </Popconfirm>
          )}
          {record.status === 'INACTIVE' && (
            <Popconfirm
              title="Are you sure you want to reactivate this user?"
              onConfirm={() => updateStatusMutation.mutate({ id: record.id, status: 'ACTIVE' })}
              okText="Yes"
              cancelText="No"
            >
              <Button type="link" icon={<UserAddOutlined />}>
                Reactivate
              </Button>
            </Popconfirm>
          )}
          
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
      const dataToExport = users.map(user => ({
        ...user,
        lastLogin: user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'
      }));
      const csv = Papa.unparse(dataToExport)
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