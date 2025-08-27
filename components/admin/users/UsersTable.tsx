'use client'

import { useState, useMemo } from 'react'
import { Tag, Button, Space, App } from 'antd'
import { ColumnsType } from 'antd/es/table'
import { DownloadOutlined, DeleteOutlined, UserAddOutlined } from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/store'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
// @ts-ignore - papaparse types not available
import Papa from 'papaparse'

import CrudTable, { CrudField } from '@/components/admin/CrudTable'
import AddUser from '@/components/admin/AddUser'
import { apiClient } from '@/lib/api-client'

// --- TYPE DEFINITIONS ---
interface User {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'BSS' | 'INFOSEC' | 'AGENT' | 'SUPERVISOR'
  status: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'INACTIVE' | 'DELETED'
  createdAt: string
  updatedAt?: string
  lastLogin?: string
}

// --- API FUNCTIONS ---
const fetchUsers = async (searchText: string): Promise<User[]> => {
  const params: any = { status: 'ACTIVE,PENDING,REJECTED,INACTIVE' };
  if (searchText) {
    params.search = searchText;
  }
  return apiClient.get<User[]>('/admin/users', params);
};

const deleteUser = (id: string) => apiClient.delete(`/admin/users/${id}`);
const updateUser = (user: Partial<User> & { id: string }) => apiClient.put(`/admin/users/${user.id}`, user);
const updateUserStatus = ({ id, status }: { id: string, status: 'ACTIVE' | 'REJECTED' }) => apiClient.put(`/admin/users/${id}/status`, { status });


// --- COMPONENT ---
export default function UsersTable() {
  // --- STATE MANAGEMENT ---
  const [searchText, setSearchText] = useState('')
  const [isAddUserModalVisible, setAddUserModalVisible] = useState(false)
  
  // --- HOOKS ---
  const router = useRouter()
  const { message } = App.useApp()
  const userRole = useSelector((state: RootState) => state.auth.user?.role);
  const queryClient = useQueryClient();

  // --- QUERIES AND MUTATIONS ---
  const { data: users = [], isLoading, isError, error } = useQuery<User[], Error>({
    queryKey: ['users', searchText],
    queryFn: () => fetchUsers(searchText),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      message.success('User deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: Error) => {
      message.error(error.message || 'Failed to delete user');
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      message.success('User updated successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: Error) => {
      message.error(error.message || 'Failed to update user');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: updateUserStatus,
    onSuccess: (data, variables) => {
      message.success(`User status updated to ${variables.status}`);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: Error) => {
      message.error(error.message || 'Failed to update user status');
    },
  });

  // --- EVENT HANDLERS ---
  const handleSearch = (value: string) => {
    setSearchText(value)
  }

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  }

  const handleSubmit = async (values: any, record: User | null) => {
    if (record) {
      updateMutation.mutate({ ...values, id: record.id });
    }
  }

  const handleUpdateStatus = (id: string, status: 'ACTIVE' | 'REJECTED') => {
    updateStatusMutation.mutate({ id, status });
  }

  const handleExport = () => {
    const csv = Papa.unparse(users)
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
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'default';
        if (status === 'ACTIVE') color = 'green';
        if (status === 'PENDING') color = 'orange';
        if (status === 'REJECTED') color = 'red';
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      }
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

  if (isError) {
    message.error(`Failed to load user data: ${error.message}`);
  }

  return (
    <>
      <CrudTable<User>
        title="User Management"
        columns={columns}
        fields={fields}
        dataSource={users}
        loading={isLoading}
        onSearch={handleSearch}
        onDelete={handleDelete}
        onSubmit={handleSubmit}
        customRowActions={(record, handleEdit) => {
          if (record.status === 'PENDING') {
            return (
              <Space>
                <Button type="primary" onClick={() => handleUpdateStatus(record.id, 'ACTIVE')}>
                  Accept
                </Button>
                <Button danger onClick={() => handleUpdateStatus(record.id, 'REJECTED')}>
                  Reject
                </Button>
              </Space>
            );
          }
          if (record.status === 'ACTIVE') {
            return (
              <Space>
                <Button type="link" onClick={() => handleEdit(record)}>
                  Edit
                </Button>
                <Button type="link" danger onClick={() => handleDelete(record.id)}>
                  Delete
                </Button>
              </Space>
            );
          }
          return null;
        }}
        customActions={
          <Space>
            {userRole && ['ADMIN', 'BSS'].includes(userRole) && (
              <Button icon={<UserAddOutlined />} onClick={() => setAddUserModalVisible(true)}>
                Add User
              </Button>
            )}
            <Button icon={<DownloadOutlined />} onClick={handleExport}>
              Export to CSV
            </Button>
            {userRole === 'ADMIN' && (
              <Button icon={<DeleteOutlined />} onClick={() => router.push('/admin/users/deleted')}>
                View Deleted Users
              </Button>
            )}
          </Space>
        }
      />
      <AddUser
        visible={isAddUserModalVisible}
        onClose={() => setAddUserModalVisible(false)}
        onUserAdded={() => queryClient.invalidateQueries({ queryKey: ['users'] })}
      />
    </>
  )
}
