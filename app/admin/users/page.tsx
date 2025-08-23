'use client'

import { useState, useMemo, useEffect } from 'react'
import { Tag, Button, Space, App } from 'antd'
import { ColumnsType } from 'antd/es/table'
import { DownloadOutlined, DeleteOutlined, UserAddOutlined } from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/store'
import Papa from 'papaparse'

import CrudTable, { CrudField } from '@/components/admin/CrudTable'
import AddUser from '@/components/admin/AddUser'
import { useCrud } from '@/hooks/useCrud'

// --- TYPE DEFINITIONS ---
interface User {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'BSS' | 'INFOSEC' | 'AGENT' | 'TEAMLEADER'
  createdAt: string
  updatedAt?: string
  lastLogin?: string
}

// --- COMPONENT ---
export default function UsersPage() {
  // --- STATE MANAGEMENT ---
  const [isAddUserModalVisible, setAddUserModalVisible] = useState(false)
  
  // --- HOOKS ---
  const router = useRouter()
  const { message } = App.useApp()
  const userRole = useSelector((state: RootState) => state.auth.user?.role)

  const {
    data,
    loading,
    isModalVisible: isEditModalVisible,
    editingRecord,
    handleSearch,
    handleEdit,
    handleDelete,
    handleSubmit,
    closeModal: closeEditModal,
    fetchData,
  } = useCrud<User>('/api/admin/users', 'user')

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // --- EVENT HANDLERS ---
  const handleExport = () => {
    const csv = Papa.unparse(data)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.setAttribute('download', 'users.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // --- MEMOIZED PROPS ---
  const fields: CrudField[] = useMemo(() => [
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { 
      name: 'role', 
      label: 'Role', 
      type: 'select', 
      required: true,
      options: [
        { label: 'Admin', value: 'ADMIN' },
        { label: 'BSS', value: 'BSS' },
        { label: 'InfoSec', value: 'INFOSEC' },
        { label: 'Agent', value: 'AGENT' },
        { label: 'Teamleader', value: 'TEAMLEADER' },
      ]
    }
  ], [])

  const columns: ColumnsType<User> = useMemo(() => [
    { title: 'Name', dataIndex: 'name', key: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { 
      title: 'Role', 
      dataIndex: 'role', 
      key: 'role',
      render: (role: string) => <Tag>{role.toUpperCase()}</Tag>
    },
    { 
      title: 'Created Date', 
      dataIndex: 'createdAt', 
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString()
    },
    { 
      title: 'Last Login', 
      dataIndex: 'lastLogin', 
      key: 'lastLogin',
      render: (date: string) => date ? new Date(date).toLocaleDateString() : '-'
    },
  ], [])

  // --- RENDER LOGIC ---
  const hasAccess = userRole && ['ADMIN', 'BSS', 'INFOSEC'].includes(userRole)
  if (!hasAccess) {
    return <p>Access Denied</p> // Or a more sophisticated component
  }

  return (
    <>
      <CrudTable<User>
        title="User Management"
        columns={columns}
        fields={fields}
        dataSource={data}
        loading={loading}
        onSearch={handleSearch}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSubmit={handleSubmit}
        isModalVisible={isEditModalVisible}
        closeModal={closeEditModal}
        editingRecord={editingRecord}
        customActions={
          <Space>
            <Button icon={<UserAddOutlined />} onClick={() => setAddUserModalVisible(true)}>
              Add User
            </Button>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>
              Export to CSV
            </Button>
            <Button icon={<DeleteOutlined />} onClick={() => router.push('/admin/users/deleted')}>
              View Deleted Users
            </Button>
          </Space>
        }
      />
      <AddUser
        visible={isAddUserModalVisible}
        onClose={() => setAddUserModalVisible(false)}
        onUserAdded={fetchData} // Refetch data when a user is added
      />
    </>
  )
}
