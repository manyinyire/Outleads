'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { App } from 'antd'
import { ColumnsType } from 'antd/es/table'
import CrudTable, { CrudField } from '@/components/admin/shared/CrudTable'

interface Sector {
  id: string
  name: string
}

export default function SectorsPage() {
  const [data, setData] = useState<Sector[]>([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  
  const { message } = App.useApp()

  const fetchData = useCallback(async () => {
    setLoading(true)
    const token = localStorage.getItem('auth-token')
    if (!token) {
      message.error("Authentication token not found. Please log in again.");
      setLoading(false);
      return;
    }

    try {
      const url = new URL('/api/admin/sectors', window.location.origin)
      if (searchText) {
        url.searchParams.set('search', searchText)
      }
      
      const response = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`)
      
      const result = await response.json()
      setData(Array.isArray(result.data) ? result.data : [])
      
    } catch (error) {
      console.error("Fetch error:", error)
      message.error('Failed to load sectors.')
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

  const handleDelete = async (id: string) => {
    const token = localStorage.getItem('auth-token');
    try {
      const response = await fetch(`/api/admin/sectors/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        message.success('Sector deleted successfully');
        fetchData();
      } else {
        const error = await response.json();
        message.error(error.message || 'Failed to delete sector');
      }
    } catch (error) {
      console.error("Delete error:", error);
      message.error('An error occurred while deleting the sector.');
    }
  }

  const handleSubmit = async (values: any, record: Sector | null) => {
    const token = localStorage.getItem('auth-token');
    const url = record ? `/api/admin/sectors/${record.id}` : '/api/admin/sectors';
    const method = record ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(values)
      });

      if (response.ok) {
        message.success(`Sector ${record ? 'updated' : 'created'} successfully`);
        fetchData();
      } else {
        const error = await response.json();
        message.error(error.message || `Failed to save sector`);
      }
    } catch (error) {
      console.error("Submit error:", error);
      message.error('An error occurred while saving the sector.');
    }
  }

  const fields: CrudField[] = useMemo(() => [
    { name: 'name', label: 'Sector Name', type: 'text', required: true },
  ], [])

  const columns: ColumnsType<Sector> = useMemo(() => [
    { title: 'Name', dataIndex: 'name', key: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
  ], [])

  return (
    <CrudTable<Sector>
      title="Business Sectors"
      columns={columns}
      fields={fields}
      dataSource={data}
      loading={loading}
      onSearch={handleSearch}
      onDelete={handleDelete}
      onSubmit={handleSubmit}
    />
  )
}