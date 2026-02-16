'use client'

import { useState, useEffect } from 'react'
import { Modal, Form, Input, Select, Button, App, Space } from 'antd'
import { PlusOutlined } from '@ant-design/icons'

interface Product {
  id: string
  name: string
}

interface QuickLeadEntryModalProps {
  visible: boolean
  campaignId: string
  campaignName: string
  onClose: () => void
  onSuccess: () => void
}

export default function QuickLeadEntryModal({
  visible,
  campaignId,
  campaignName,
  onClose,
  onSuccess
}: QuickLeadEntryModalProps) {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const { message } = App.useApp()

  useEffect(() => {
    if (visible) {
      fetchProducts()
      form.resetFields()
    }
  }, [visible, form])

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('auth-token')
      const response = await fetch('/api/admin/products?limit=1000', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!response.ok) throw new Error('Failed to fetch products')
      
      const result = await response.json()
      setProducts(Array.isArray(result.data) ? result.data : [])
    } catch (error) {
      console.error('Error fetching products:', error)
      message.error('Failed to load products')
    }
  }

  const handleSubmit = async (values: any) => {
    setLoading(true)
    try {
      const token = localStorage.getItem('auth-token')
      const response = await fetch(`/api/agent/campaigns/${campaignId}/add-lead`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(values)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to add lead')
      }

      message.success('Lead added successfully!')
      form.resetFields()
      onSuccess()
      onClose()
    } catch (error: any) {
      message.error(error.message || 'Failed to add lead')
    } finally {
      setLoading(false)
    }
  }

  const handleAddAnother = async () => {
    try {
      await form.validateFields()
      const values = form.getFieldsValue()
      
      setLoading(true)
      const token = localStorage.getItem('auth-token')
      const response = await fetch(`/api/agent/campaigns/${campaignId}/add-lead`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(values)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to add lead')
      }

      message.success('Lead added successfully!')
      form.resetFields()
      onSuccess()
    } catch (error: any) {
      if (error.errorFields) {
        message.error('Please fill in all required fields')
      } else {
        message.error(error.message || 'Failed to add lead')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title={`Add Lead to ${campaignName}`}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={500}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item
          name="fullName"
          label="Full Name"
          rules={[{ required: true, message: 'Please enter the lead name' }]}
        >
          <Input placeholder="Enter full name" size="large" />
        </Form.Item>

        <Form.Item
          name="phoneNumber"
          label="Phone Number"
          rules={[
            { required: true, message: 'Please enter phone number' },
            { pattern: /^[0-9+\-\s()]+$/, message: 'Please enter a valid phone number' }
          ]}
        >
          <Input placeholder="Enter phone number" size="large" />
        </Form.Item>

        <Form.Item
          name="productIds"
          label="Products"
          rules={[{ required: true, message: 'Please select at least one product' }]}
        >
          <Select
            mode="multiple"
            placeholder="Select products"
            size="large"
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={products.map(p => ({ label: p.name, value: p.id }))}
          />
        </Form.Item>

        <Form.Item>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="default"
              icon={<PlusOutlined />}
              onClick={handleAddAnother}
              loading={loading}
            >
              Add & Continue
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
            >
              Add Lead
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  )
}
