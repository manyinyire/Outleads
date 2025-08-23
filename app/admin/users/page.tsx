'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Tag, Button, Space, App } from 'antd'
import { ColumnsType } from 'antd/es/table'
import { DownloadOutlined, DeleteOutlined, UserAddOutlined } from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/store'
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
  const [isEditModalVisible, setEditModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<User | null>(null)
  
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
      setData(Array.isArray(result) ? result : result.user || [])
      
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

  const handleEdit = (record: User) => {
    setEditingRecord(record)
    setEditModalVisible(true)
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
    'use client'

import { useState, useMemo } from 'react'
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

      if (response.ok) {
        message.success(`User ${record ? 'updated' : 'created'} successfully`);
        setEditModalVisible(false);
        setEditingRecord(null);
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
        closeModal={() => setEditModalVisible(false)}
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