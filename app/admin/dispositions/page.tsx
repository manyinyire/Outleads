'use client'

import { useState, useEffect, useCallback } from 'react'
import { App, Tabs, Table, Button, Modal, Form, Input, Switch, Space, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { ColumnsType } from 'antd/es/table'
import api from '@/lib/api/api'

const { TextArea } = Input

interface FirstLevelDisposition {
  id: string
  name: string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface SecondLevelDisposition {
  id: string
  name: string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface ThirdLevelDisposition {
  id: string
  name: string
  description?: string
  category: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function DispositionsPage() {
  const [firstLevelData, setFirstLevelData] = useState<FirstLevelDisposition[]>([])
  const [secondLevelData, setSecondLevelData] = useState<SecondLevelDisposition[]>([])
  const [thirdLevelData, setThirdLevelData] = useState<ThirdLevelDisposition[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [modalType, setModalType] = useState<'first' | 'second' | 'third'>('first')
  const [editingItem, setEditingItem] = useState<any>(null)
  const [form] = Form.useForm()
  const { message } = App.useApp()

  const fetchFirstLevel = useCallback(async () => {
    try {
      setLoading(true)
      const data: any = await api.get('/admin/dispositions/first-level')
      setFirstLevelData(data?.data || data || [])
    } catch (error) {
      message.error('Failed to fetch first level dispositions')
    } finally {
      setLoading(false)
    }
  }, [message])

  const fetchSecondLevel = useCallback(async () => {
    try {
      setLoading(true)
      const data: any = await api.get('/admin/dispositions/second-level')
      setSecondLevelData(data?.data || data || [])
    } catch (error) {
      message.error('Failed to fetch second level dispositions')
    } finally {
      setLoading(false)
    }
  }, [message])

  const fetchThirdLevel = useCallback(async () => {
    try {
      setLoading(true)
      const data: any = await api.get('/admin/dispositions/third-level')
      setThirdLevelData(data?.data || data || [])
    } catch (error) {
      message.error('Failed to fetch third level dispositions')
    } finally {
      setLoading(false)
    }
  }, [message])

  useEffect(() => {
    fetchFirstLevel()
    fetchSecondLevel()
    fetchThirdLevel()
  }, [fetchFirstLevel, fetchSecondLevel, fetchThirdLevel])

  const handleAdd = (type: 'first' | 'second' | 'third') => {
    setModalType(type)
    setEditingItem(null)
    form.resetFields()
    form.setFieldValue('isActive', true)
    setModalVisible(true)
  }

  const handleEdit = (record: any, type: 'first' | 'second' | 'third') => {
    setModalType(type)
    setEditingItem(record)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleDelete = async (id: string, type: 'first' | 'second' | 'third') => {
    try {
      const endpoint = type === 'first' 
        ? `/admin/dispositions/first-level/${id}`
        : type === 'second'
        ? `/admin/dispositions/second-level/${id}`
        : `/admin/dispositions/third-level/${id}`
      
      await api.delete(endpoint)
      message.success('Disposition deleted successfully')
      
      if (type === 'first') {
        fetchFirstLevel()
      } else if (type === 'second') {
        fetchSecondLevel()
      } else {
        fetchThirdLevel()
      }
    } catch (error: any) {
      if (error.response?.data?.message?.includes('assigned to leads')) {
        message.error('Cannot delete disposition that is assigned to leads')
      } else {
        message.error('Failed to delete disposition')
      }
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)

      if (editingItem) {
        // Update
        const endpoint = modalType === 'first'
          ? `/admin/dispositions/first-level/${editingItem.id}`
          : modalType === 'second'
          ? `/admin/dispositions/second-level/${editingItem.id}`
          : `/admin/dispositions/third-level/${editingItem.id}`
        
        await api.put(endpoint, values)
        message.success('Disposition updated successfully')
      } else {
        // Create
        const endpoint = modalType === 'first'
          ? '/admin/dispositions/first-level'
          : modalType === 'second'
          ? '/admin/dispositions/second-level'
          : '/admin/dispositions/third-level'
        
        await api.post(endpoint, values)
        message.success('Disposition created successfully')
      }

      setModalVisible(false)
      form.resetFields()
      
      if (modalType === 'first') {
        fetchFirstLevel()
      } else if (modalType === 'second') {
        fetchSecondLevel()
      } else {
        fetchThirdLevel()
      }
    } catch (error: any) {
      if (error.errorFields) {
        message.error('Please fill in all required fields')
      } else if (error.response?.data?.message?.includes('already exists')) {
        message.error('A disposition with this name already exists')
      } else {
        message.error('Failed to save disposition')
      }
    } finally {
      setLoading(false)
    }
  }

  const firstLevelColumns: ColumnsType<FirstLevelDisposition> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <span style={{ color: isActive ? 'green' : 'red' }}>
          {isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record, 'first')}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete Disposition"
            description="Are you sure you want to delete this disposition?"
            onConfirm={() => handleDelete(record.id, 'first')}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const thirdLevelColumns: ColumnsType<ThirdLevelDisposition> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => (
        <span style={{ 
          padding: '4px 8px', 
          borderRadius: '4px',
          background: category === 'no_sale' ? '#fff1f0' : '#e6f7ff',
          color: category === 'no_sale' ? '#cf1322' : '#0958d9'
        }}>
          {category === 'no_sale' ? 'No Sale' : 'Not Contacted'}
        </span>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <span style={{ color: isActive ? 'green' : 'red' }}>
          {isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record, 'third')}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete Disposition"
            description="Are you sure you want to delete this disposition?"
            onConfirm={() => handleDelete(record.id, 'third')}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const secondLevelColumns: ColumnsType<SecondLevelDisposition> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <span style={{ color: isActive ? 'green' : 'red' }}>
          {isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record, 'second')}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete Disposition"
            description="Are you sure you want to delete this disposition?"
            onConfirm={() => handleDelete(record.id, 'second')}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const tabItems = [
    {
      key: 'first',
      label: 'Contact Status (Level 1)',
      children: (
        <>
          <div style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleAdd('first')}
            >
              Add Contact Status
            </Button>
          </div>
          <Table
            columns={firstLevelColumns}
            dataSource={firstLevelData}
            rowKey="id"
            loading={loading}
            pagination={false}
          />
        </>
      ),
    },
    {
      key: 'second',
      label: 'Sale Status (Level 2)',
      children: (
        <>
          <div style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleAdd('second')}
            >
              Add Sale Status
            </Button>
          </div>
          <Table
            columns={secondLevelColumns}
            dataSource={secondLevelData}
            rowKey="id"
            loading={loading}
            pagination={false}
          />
        </>
      ),
    },
    {
      key: 'third',
      label: 'Reasons (Level 3)',
      children: (
        <>
          <div style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleAdd('third')}
            >
              Add Reason
            </Button>
          </div>
          <Table
            columns={thirdLevelColumns}
            dataSource={thirdLevelData}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 20 }}
          />
        </>
      ),
    },
  ]

  return (
    <div style={{ padding: '24px' }}>
      <h1>Disposition Management</h1>
      <p style={{ marginBottom: 24, color: '#666' }}>
        Manage call disposition options. Level 1 determines contact status, Level 2 determines sale outcome, Level 3 provides reasons.
      </p>

      <Tabs items={tabItems} />

      <Modal
        title={`${editingItem ? 'Edit' : 'Add'} ${modalType === 'first' ? 'Contact Status' : modalType === 'second' ? 'Sale Status' : 'Reason'}`}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false)
          form.resetFields()
        }}
        onOk={handleSubmit}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please enter a name' }]}
          >
            <Input placeholder="e.g., Contacted, Not Interested" />
          </Form.Item>

          {modalType === 'third' && (
            <Form.Item
              name="category"
              label="Category"
              rules={[{ required: true, message: 'Please select a category' }]}
            >
              <select className="ant-input" style={{ width: '100%', padding: '4px 11px' }}>
                <option value="">Select category</option>
                <option value="no_sale">No Sale</option>
                <option value="not_contacted">Not Contacted</option>
              </select>
            </Form.Item>
          )}

          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea rows={3} placeholder="Optional description" />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Active"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
