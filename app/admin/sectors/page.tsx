'use client'

import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, message, Popconfirm, Space, Typography } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/store'

const { Title } = Typography

interface Sector {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

export default function SectorsPage() {
  const [sectors, setSectors] = useState<Sector[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingSector, setEditingSector] = useState<Sector | null>(null)
  const [form] = Form.useForm()
  
  const { user } = useSelector((state: RootState) => state.auth)

  // Check if user has ADMIN role
  if (user?.role !== 'ADMIN') {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Title level={3}>Access Denied</Title>
        <p>You don't have permission to access this page.</p>
      </div>
    )
  }

  const fetchSectors = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/sectors', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setSectors(Array.isArray(data) ? data : [])
      } else {
        message.error('Failed to fetch sectors')
        setSectors([])
      }
    } catch (error) {
      console.error('Error fetching sectors:', error)
      message.error('Failed to fetch sectors')
      setSectors([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSectors()
  }, [])

  const handleCreate = () => {
    setEditingSector(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (sector: Sector) => {
    setEditingSector(sector)
    form.setFieldsValue({
      name: sector.name
    })
    setModalVisible(true)
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/sectors/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        message.success('Sector deleted successfully')
        fetchSectors()
      } else {
        const error = await response.json()
        message.error(error.message || 'Failed to delete sector')
      }
    } catch (error) {
      console.error('Error deleting sector:', error)
      message.error('Failed to delete sector')
    }
  }

  const handleSubmit = async (values: { name: string }) => {
    try {
      const url = editingSector 
        ? `/api/admin/sectors/${editingSector.id}`
        : '/api/admin/sectors'
      
      const method = editingSector ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(values)
      })

      if (response.ok) {
        message.success(`Sector ${editingSector ? 'updated' : 'created'} successfully`)
        setModalVisible(false)
        form.resetFields()
        fetchSectors()
      } else {
        const error = await response.json()
        message.error(error.message || `Failed to ${editingSector ? 'update' : 'create'} sector`)
      }
    } catch (error) {
      console.error('Error saving sector:', error)
      message.error(`Failed to ${editingSector ? 'update' : 'create'} sector`)
    }
  }

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: Sector, b: Sector) => a.name.localeCompare(b.name),
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
      sorter: (a: Sector, b: Sector) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Sector) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this sector?"
            description="This will fail if there are leads associated with this sector."
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2}>Business Sectors Management</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreate}
        >
          Add Sector
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={sectors}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `Total ${total} sectors`,
        }}
      />

      <Modal
        title={editingSector ? 'Edit Sector' : 'Add Sector'}
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
            label="Sector Name"
            rules={[
              { required: true, message: 'Please enter sector name' },
              { min: 2, message: 'Sector name must be at least 2 characters' }
            ]}
          >
            <Input placeholder="Enter sector name" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                {editingSector ? 'Update' : 'Create'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
