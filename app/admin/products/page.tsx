'use client'

import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, message, Popconfirm, Space, Typography, Select } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/store'

const { Title } = Typography
const { TextArea } = Input
const { Option } = Select

interface Product {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
  parentId?: string | null
  parent?: Product | null
  subProducts?: Product[]
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [form] = Form.useForm()
  
  const { user } = useSelector((state: RootState) => state.auth)

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/products', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setProducts(Array.isArray(data) ? data : [])
      } else {
        message.error('Failed to fetch products')
        setProducts([])
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      message.error('Failed to fetch products')
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchProducts()
    }
  }, [user])

  if (user?.role !== 'ADMIN') {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Title level={3}>Access Denied</Title>
        <p>You don't have permission to access this page.</p>
      </div>
    )
  }

  const handleCreate = () => {
    setEditingProduct(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    form.setFieldsValue({
      name: product.name,
      description: product.description,
      parentId: product.parentId,
    })
    setModalVisible(true)
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        message.success('Product deleted successfully')
        fetchProducts()
      } else {
        const error = await response.json()
        message.error(error.message || 'Failed to delete product')
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      message.error('Failed to delete product')
    }
  }

  const handleSubmit = async (values: { name: string; description?: string; parentId?: string }) => {
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
        form.resetFields()
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
      render: (parentName: string) => parentName || '-',
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
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this product?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
            disabled={record.subProducts && record.subProducts.length > 0}
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              disabled={record.subProducts && record.subProducts.length > 0}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const parentProducts = products.filter(p => !p.parentId);

  const processedData = products
    .filter(p => !p.parentId)
    .map(p => ({
      ...p,
      children: p.subProducts,
    }));

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2}>Products Management</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreate}
        >
          Add Product
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={processedData}
        rowKey="id"
        loading={loading}
        pagination={false} // Pagination can be tricky with tree data, disabling for now
      />

      <Modal
        title={editingProduct ? 'Edit Product' : 'Add Product'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false)
          form.resetFields()
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="Product Name"
            rules={[
              { required: true, message: 'Please enter product name' },
              { min: 2, message: 'Product name must be at least 2 characters' }
            ]}
          >
            <Input placeholder="Enter product name" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea
              rows={4}
              placeholder="Enter product description (optional)"
            />
          </Form.Item>
          
          <Form.Item
            name="parentId"
            label="Parent Product (optional)"
          >
            <Select
              placeholder="Select a parent product"
              allowClear
            >
              {parentProducts
                .filter(p => p.id !== editingProduct?.id) // Prevent self-parenting
                .map(p => (
                  <Option key={p.id} value={p.id}>{p.name}</Option>
                ))}
            </Select>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                {editingProduct ? 'Update' : 'Create'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
