'use client'

import { useState, useEffect, Key } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Typography,
  Space,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/store'

interface Product {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
  parentId?: string | null
  parent?: Product | null
  subProducts?: Product[],
  key?: Key
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  
  
  const { user } = useSelector((state: RootState) => state.auth)

  const [form] = Form.useForm()

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => text || '-',
    },
    {
      title: 'Parent Product',
      dataIndex: ['parent', 'name'],
      key: 'parent',
      render: (text: string) => text || '-',
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Product) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Button
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
            disabled={record.subProducts && record.subProducts.length > 0}
            danger
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ]

  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const fetchProducts = async (page = 1, pageSize = 10) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/products?page=${page}&limit=${pageSize}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setProducts(Array.isArray(data.products) ? data.products : [])
        setPagination(prev => ({ ...prev, total: data.totalPages * pageSize, current: page, pageSize: pageSize }))
      } else {
        message.error("Failed to fetch products")
        setProducts([])
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      message.error("Failed to fetch products")
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchProducts(pagination.current, pagination.pageSize)
    }
  }, [user, pagination])

  if (user?.role !== 'ADMIN') {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p>You don&apos;t have permission to access this page.</p>
      </div>
    )
  }

  const handleCreate = () => {
    setEditingProduct(null)
    setModalVisible(true)
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    form.setFieldsValue({ ...product, parentId: product.parentId || undefined })
    setModalVisible(true)
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        message.success("Product deleted successfully")
        fetchProducts()
      } else {
        const error = await response.json()
        message.error(error.message || "Failed to delete product")
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      message.error("Failed to delete product")
    }
  }

  const handleSubmit = async (values: any) => {

    try {
      const url = editingProduct 
        ? `/api/admin/products/${editingProduct.id}`
        : '/api/admin/products'
      
      const method = editingProduct ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ ...values, parentId: values.parentId || null }),
      })

      if (response.ok) {
        message.success(`Product ${editingProduct ? 'updated' : 'created'} successfully`)
        setModalVisible(false)
        fetchProducts()
      } else {
        const error = await response.json()
        message.error(error.message || `Failed to ${editingProduct ? 'update' : 'create'} product`)
      }
    } catch (error) {
      console.error('Error saving product:', error)
      message.error(`Failed to ${editingProduct ? 'update' : 'create'} product`)
    }
  }

  const parentProducts = products.filter(p => !p.parentId);

  const tableDataSource = products
    .filter(p => !p.parentId)
    .map(p => ({
      ...p,
      children: p.subProducts && p.subProducts.length > 0 ? p.subProducts : undefined,
    }));

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography.Title level={2}>Products Management</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          Add Product
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={tableDataSource}
        loading={loading}
        rowKey="id"
        pagination={pagination}
        onChange={(pagination) => fetchProducts(pagination.current, pagination.pageSize)}
        expandable={{
          rowExpandable: record => record.children && record.children.length > 0,
        }}
      />

      <Modal
        title={editingProduct ? 'Edit Product' : 'Add Product'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please enter a name' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea />
          </Form.Item>
          <Form.Item name="parentId" label="Parent Product">
            <Select allowClear>
              {parentProducts
                .filter(p => p.id !== editingProduct?.id)
                .map(p => (
                  <Select.Option key={p.id} value={p.id}>
                    {p.name}
                  </Select.Option>
                ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="category"
            label="Category"
            rules={[{ required: true, message: 'Please select a category' }]}
          >
            <Select>
              <Select.Option value="finance">Finance</Select.Option>
              <Select.Option value="insurance">Insurance</Select.Option>
              <Select.Option value="investment">Investment</Select.Option>
              <Select.Option value="banking">Banking</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}