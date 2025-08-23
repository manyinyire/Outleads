'use client'

import { useMemo } from 'react'
import { Tag } from 'antd'
import { ColumnsType } from 'antd/es/table'
import CrudTable, { CrudField } from '@/components/admin/CrudTable'
import { useCrud } from '@/hooks/useCrud'

interface ProductCategory {
  id: string
  name: string
  description?: string
  _count: {
    products: number
  }
}

export default function ProductCategoriesPage() {
  const {
    data,
    loading,
    isModalVisible,
    editingRecord,
    handleSearch,
    handleEdit,
    handleDelete,
    handleSubmit,
    closeModal,
  } = useCrud<ProductCategory>('/api/admin/product-categories', 'productCategory')

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
      onEdit={handleEdit}
      onDelete={handleDelete}
      onSubmit={handleSubmit}
      isModalVisible={isModalVisible}
      closeModal={closeModal}
      editingRecord={editingRecord}
    />
  )
}
