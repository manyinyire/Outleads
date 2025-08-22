'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { App, Tag } from 'antd'
import { ColumnsType } from 'antd/es/table'
import CrudTable, { CrudField } from '@/components/admin/CrudTable'

interface Lead {
  id: string
  fullName: string
  phoneNumber: string
  businessSector: { name: string }
  products: Array<{ name: string }>
  campaign?: { name: string }
  createdAt: string
}

export default function LeadsPage() {
  const [data, setData] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  const [isModalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<Lead | null>(null)
  
  const { message } = App.useApp()

  const fetchData = useCallback(async () => {
    setLoading(true)
    const token = localStorage.getItem('auth-token')
    if (!token) {
      // This check is a safeguard; AdminLayout should prevent this page from rendering without a token.
      message.error("Authentication token not found.");
      setLoading(false);
      return;
    }

    try {
      const url = new URL('/api/admin/leads', window.location.origin)
      if (searchText) {
        url.searchParams.set('search', searchText)
      }
      
      const response = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`)
      
      const result = await response.json()
      setData(result.lead || [])
      
    } catch (error) {
      console.error("Fetch error:", error)
      message.error('Failed to load leads.')
    } finally {
      setLoading(false)
    }
  }, [searchText, message])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSearch = (value: string) => {
    setSearchText(value)
  }

  const handleEdit = (record: Lead) => {
    setEditingRecord(record)
    setModalVisible(true)
  }

  const handleDelete = async (id: string) => {
    // Implement delete logic here if needed
  }

  const handleSubmit = async (values: any, record: Lead | null) => {
    // Implement create/update logic here if needed
  }

  const fields: CrudField[] = useMemo(() => [
    { name: 'fullName', label: 'Name', type: 'text', required: true },
    { name: 'phoneNumber', label: 'Phone', type: 'text', required: true },
  ], [])

  const columns: ColumnsType<Lead> = useMemo(() => [
    { title: 'Name', dataIndex: 'fullName', key: 'fullName' },
    { title: 'Phone', dataIndex: 'phoneNumber', key: 'phoneNumber' },
    { title: 'Sector', dataIndex: ['businessSector', 'name'], key: 'sector' },
    {
      title: 'Products',
      dataIndex: 'products',
      key: 'products',
      render: (products: Array<{ name: string }>) => (
        <>
          {products.map(p => <Tag key={p.name}>{p.name}</Tag>)}
        </>
      ),
    },
    { 
      title: 'Campaign', 
      dataIndex: 'campaign', 
      key: 'campaign',
      render: (campaign) => campaign ? campaign.name : <Tag>Direct Lead</Tag>
    },
    { title: 'Date', dataIndex: 'createdAt', key: 'createdAt', render: (date) => new Date(date).toLocaleDateString() },
  ], [])

  return (
    <CrudTable<Lead>
      title="Lead Management"
      columns={columns}
      fields={fields}
      dataSource={data}
      loading={loading}
      onSearch={handleSearch}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onSubmit={handleSubmit}
      isModalVisible={isModalVisible}
      closeModal={() => {
        setModalVisible(false)
        setEditingRecord(null)
      }}
      editingRecord={editingRecord}
    />
  )
}
