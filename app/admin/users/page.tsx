'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Tag, Button, Space, App } from 'antd'
import { ColumnsType } from 'antd/es/table'
import { DownloadOutlined, DeleteOutlined, UserAddOutlined } from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/store'
// @ts-ignore - papaparse types not available
import Papa from 'papaparse'

import CrudTable, { CrudField } from '@/components/admin/CrudTable'
import AddUser from '@/components/admin/AddUser'

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
  const [data, setData] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  const [isAddUserModalVisible, setAddUserModalVisible] = useState(false)
  
  // --- HOOKS ---
  const router = useRouter()
  const { message } = App.useApp()
  const userRole = useSelector((state: RootState) => state.auth.user?.role)

  // --- DATA FETCHING ---
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const url = new URL('/api/admin/users', window.location.origin)
      if (searchText) {
        url.searchParams.set('search', searchText)
      }
      
      const token = localStorage.getItem('auth-token')
      const response = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`)
      
      const result = await response.json()
      setData(Array.isArray(result.data) ? result.data : [])
      
    } catch (error) {
      console.error("Fetch error:", error)
      message.error('Failed to load user data.')
    } finally {
      setLoading(false)
    }
  }, [searchText, message])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // --- EVENT HANDLERS ---
  const handleSearch = (value: string) => {
    setSearchText(value)
  }


  const handleDelete = async (id: string) => {
    const token = localStorage.getItem('auth-token');
    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        message.success('User deleted successfully');
        fetchData(); // Refresh data
      } else {
        const error = await response.json();
        message.error(error.message || 'Failed to delete user');
      }
    } catch (error) {
      console.error("Delete error:", error);
      message.error('An error occurred while deleting the user.');
    }
  }

  const handleSubmit = async (values: any, record: User | null) => {
    const token = localStorage.getItem('auth-token');
    const url = record ? `/api/admin/users/${record.id}` : '/api/admin/users';
    const method = record ? 'PUT' : 'POST';
    const payload = record ? { role: values.role } : values;

    try {
      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        message.success(`User ${record ? 'updated' : 'created'} successfully`);
        fetchData(); // Refresh data
      } else {
        const error = await response.json();
        message.error(error.message || `Failed to save user`);
      }
    } catch (error) {
      console.error("Submit error:", error);
      message.error('An error occurred while saving the user.');
    }
  }

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
    { name: 'name', label: 'Name', type: 'text', required: true, readOnly: true },
    { name: 'email', label: 'Email', type: 'email', required: true, readOnly: true },
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
        { label: 'Supervisor', value: 'SUPERVISOR' },
        { label: 'Employee', value: 'EMPLOYEE' },
        { label: 'Manager', value: 'MANAGER' },
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

  return (
    <>
      <CrudTable<User>
        title="User Management"
        columns={columns}
        fields={fields}
        dataSource={data}
        loading={loading}
        onSearch={handleSearch}
        onDelete={handleDelete}
        onSubmit={handleSubmit}
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