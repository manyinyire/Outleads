'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { App, Button, Tag, message } from 'antd'
import { CopyOutlined } from '@ant-design/icons'
import CrudTable, { CrudField } from '@/components/admin/CrudTable'
import { ColumnsType } from 'antd/es/table'

interface Campaign {
  id: string
  name: string
  companyName: string
  uniqueLink: string
  createdAt: string
}

export default function CampaignsPage() {
  const [data, setData] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  const [isModalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<Campaign | null>(null)
  
  const { message } = App.useApp()

  const fetchData = useCallback(async () => {
    setLoading(true)
    const token = localStorage.getItem('auth-token')
    if (!token) {
      message.error("Authentication token not found.");
      setLoading(false);
      return;
    }

    try {
      const url = new URL('/api/admin/campaigns', window.location.origin)
      if (searchText) {
        url.searchParams.set('search', searchText)
      }
      
      const response = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`)
      
      const result = await response.json()
      setData(result.campaign || [])
      
    } catch (error) {
      console.error("Fetch error:", error)
      message.error('Failed to load campaigns.')
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

  const handleEdit = (record: Campaign) => {
    setEditingRecord(record)
    setModalVisible(true)
  }

  const handleDelete = async (id: string) => {
    // Implement delete logic
  }

  const handleSubmit = async (values: any, record: Campaign | null) => {
    // Implement create/update logic
  }

  const fields: CrudField[] = useMemo(() => [
    { name: 'name', label: 'Campaign Name', required: true },
    { name: 'companyName', label: 'Company Name', required: true },
  ], [])

  const columns: ColumnsType<Campaign> = useMemo(() => [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Company', dataIndex: 'companyName', key: 'companyName' },
    { 
      title: 'Link', 
      dataIndex: 'uniqueLink', 
      key: 'uniqueLink',
      render: (link: string) => {
        const fullUrl = `${window.location.origin}?campaign=${link}`;
        return (
          <Button 
            type="link" 
            onClick={() => {
              navigator.clipboard.writeText(fullUrl)
              message.success('Link copied!')
            }}
          >
            Copy Link
          </Button>
        )
      }
    },
    { title: 'Date', dataIndex: 'createdAt', key: 'createdAt', render: (date) => new Date(date).toLocaleDateString() },
  ], [])

  return (
    <CrudTable<Campaign>
      title="Campaign Management"
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
