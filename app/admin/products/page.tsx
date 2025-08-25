'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { App, Tag } from 'antd'
import { ColumnsType } from 'antd/es/table'
import CrudTable, { CrudField } from '@/components/admin/CrudTable'

interface ProductCategory {
  id: string
  name: string
}

interface Product {
  id: string
  name: string
  description?: string
  category: ProductCategory
}

export default function ProductsPage() {
  const [data, setData] = useState<Product[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  
  const { message } = App.useApp()

  const fetchCategories = useCallback(async (token: string) => {
    try {
      // Token is already checked in fetchData, so we can assume it's valid here
      const response = await fetch('/api/admin/product-categories', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Failed to fetch categories')
      const result = await response.json()
      setCategories(Array.isArray(result.data) ? result.data : [])
    } catch (error) {
      console.error("Category fetch error:", error)
      message.error('Failed to load product categories for the form.')
    }
  }, [message])

  const fetchData = useCallback(async () => {
    setLoading(true)
    const token = localStorage.getItem('auth-token')
    if (!token) {
      message.error("Authentication token not found. Please log in again.")
      setLoading(false)
      return
    }

    // Fetch categories for the dropdown first
    await fetchCategories(token)

    try {
      const url = new URL('/api/admin/products', window.location.origin)
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
      message.error('Failed to load products.')
    } finally {
      setLoading(false)
    }
  }, [searchText, message, fetchCategories])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSearch = (value: string) => {
    setSearchText(value)
  }

  const handleDelete = async (id: string) => {
    const token = localStorage.getItem('auth-token');
    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        message.success('Product deleted successfully');
        fetchData();
      } else {
        const error = await response.json();
        message.error(error.message || 'Failed to delete product');
      }
    } catch (error) {
      console.error("Delete error:", error);
      message.error('An error occurred while deleting the product.');
    }
  }

  const handleSubmit = async (values: any, record: Product | null) => {
    const token = localStorage.getItem('auth-token');
    const url = record ? `/api/admin/products/${record.id}` : '/api/admin/products';
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
        message.success(`Product ${record ? 'updated' : 'created'} successfully`);
        fetchData();
      } else {
        const error = await response.json();
        message.error(error.message || `Failed to save product`);
      }
    } catch (error) {
      console.error("Submit error:", error);
      message.error('An error occurred while saving the product.');
    }
  }

  const fields: CrudField[] = useMemo(() => [
    { name: 'name', label: 'Product Name', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'textarea' },
    {
      name: 'categoryId',
      label: 'Category',
      type: 'select',
      required: true,
      options: categories.map(cat => ({ label: cat.name, value: cat.id }))
    }
  ], [categories])

  const columns: ColumnsType<Product> = useMemo(() => [
    { title: 'Name', dataIndex: 'name', key: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    { 
      title: 'Category', 
      dataIndex: ['category', 'name'], 
      key: 'category',
      render: (categoryName: string) => <Tag>{categoryName}</Tag>
    },
  ], [])

  return (
    <CrudTable<Product>
      title="Products"
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