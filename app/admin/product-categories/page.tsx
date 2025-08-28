'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { App, Tag } from 'antd'
import { ColumnsType } from 'antd/es/table'
import CrudTable, { CrudField } from '@/components/admin/shared/CrudTable'

interface ProductCategory {
  id: string
  name: string
  description?: string
  _count: {
    products: number
  }
}

export default function ProductCategoriesPage() {
  const [data, setData] = useState<ProductCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  
  const { message } = App.useApp()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('auth-token')
      if (!token) {
        message.error("Authentication token not found. Please log in again.");
        setLoading(false);
        return;
      }

      const url = new URL('/api/admin/product-categories', window.location.origin)
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
      message.error('Failed to load product categories.')
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
      const response = await fetch(`/api/admin/product-categories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        message.success('Category deleted successfully');
        fetchData();
      } else {
        const error = await response.json();
        message.error(error.message || 'Failed to delete category');
      }
    } catch (error) {
      console.error("Delete error:", error);
      message.error('An error occurred while deleting the category.');
    }
  }

  const handleSubmit = async (values: any, record: ProductCategory | null) => {
    const token = localStorage.getItem('auth-token');
    const url = record ? `/api/admin/product-categories/${record.id}` : '/api/admin/product-categories';
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
        message.success(`Category ${record ? 'updated' : 'created'} successfully`);
        fetchData();
      } else {
        const error = await response.json();
        message.error(error.message || `Failed to save category`);
      }
    } catch (error) {
      console.error("Submit error:", error);
      message.error('An error occurred while saving the category.');
    }
  }

  const fields: CrudField[] = useMemo(() => [
    { name: 'name', label: 'Category Name', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'textarea' },
  ], [])

  const columns: ColumnsType<ProductCategory> = useMemo(() => [
    { title: 'Name', dataIndex: 'name', key: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    { 
      title: 'Sub-Products', 
      dataIndex: ['_count', 'products'], 
      key: 'products_count',
      render: (count: number) => <Tag>{count}</Tag>
    },
  ], [])

  return (
    <CrudTable<ProductCategory>
      title="Product Categories"
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
