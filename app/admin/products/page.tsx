'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { App, Tag } from 'antd'
import { ColumnsType } from 'antd/es/table'
import CrudTable, { CrudField } from '@/components/admin/CrudTable'
import { useCrud } from '@/hooks/useCrud'

interface ProductCategory {
  id: string
  name: string
}

interface Product {
  id: string
  name: string
  description?: string
  category: ProductCategory
  categoryId?: string
}

export default function ProductsPage() {
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const { message } = App.useApp()

  const {
    data,
    loading,
    isModalVisible,
    editingRecord,
    handleSearch,
    handleEdit: baseHandleEdit,
    handleDelete,
    handleSubmit,
    closeModal,
    fetchData,
  } = useCrud<Product>('/api/admin/products', 'product')

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const fetchCategories = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth-token')
      const response = await fetch('/api/admin/product-categories', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Failed to fetch categories')
      const result = await response.json()
      setCategories(result.productCategory || [])
    } catch (error) {
      console.error("Category fetch error:", error)
      message.error('Failed to load product categories for the form.')
    }
  }, [message])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const handleEdit = (record: Product) => {
    baseHandleEdit({ ...record, categoryId: record.category.id })
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
      onEdit={handleEdit}
      onDelete={handleDelete}
      onSubmit={handleSubmit}
      isModalVisible={isModalVisible}
      closeModal={closeModal}
      editingRecord={editingRecord}
    />
  )
}