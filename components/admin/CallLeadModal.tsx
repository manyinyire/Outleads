'use client'

import { useState, useEffect } from 'react'
import { Modal, Form, Select, Input, Button, App, Divider, Space, Typography, Tabs, Timeline, Tag } from 'antd'
import { PhoneOutlined, CopyOutlined, HistoryOutlined } from '@ant-design/icons'
import api from '@/lib/api/api'

const { TextArea } = Input
const { Text } = Typography

interface Lead {
  id: string
  fullName: string
  phoneNumber: string
  businessSector: { name: string }
  products: Array<{ id: string; name: string }>
  campaign?: { id: string; campaign_name: string }
  assignedTo?: { name: string }
  createdAt: string
  firstLevelDisposition?: { id: string; name: string }
  secondLevelDisposition?: { id: string; name: string }
  thirdLevelDisposition?: { id: string; name: string }
  dispositionNotes?: string
  lastCalledAt?: string
}

interface CallLeadModalProps {
  visible: boolean
  lead: Lead | null
  onClose: () => void
  onSuccess: () => void
}

interface Disposition {
  id: string
  name: string
  description?: string
  category?: string
}

export default function CallLeadModal({
  visible,
  lead,
  onClose,
  onSuccess
}: CallLeadModalProps) {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [firstLevelDispositions, setFirstLevelDispositions] = useState<Disposition[]>([])
  const [secondLevelDispositions, setSecondLevelDispositions] = useState<Disposition[]>([])
  const [thirdLevelDispositions, setThirdLevelDispositions] = useState<Disposition[]>([])
  const [selectedFirstLevel, setSelectedFirstLevel] = useState<string | undefined>()
  const [selectedSecondLevel, setSelectedSecondLevel] = useState<string | undefined>()
  const { message } = App.useApp()

  // Copy phone number to clipboard
  const handleCopyNumber = () => {
    if (lead?.phoneNumber) {
      navigator.clipboard.writeText(lead.phoneNumber)
      message.success('Phone number copied to clipboard!')
    }
  }

  useEffect(() => {
    if (visible) {
      fetchFirstLevelDispositions()
      fetchSecondLevelDispositions()
      
      // Pre-fill existing disposition data
      if (lead) {
        form.setFieldsValue({
          firstLevelDispositionId: lead.firstLevelDisposition?.id,
          secondLevelDispositionId: lead.secondLevelDisposition?.id,
          thirdLevelDispositionId: lead.thirdLevelDisposition?.id,
          dispositionNotes: lead.dispositionNotes || ''
        })
        setSelectedFirstLevel(lead.firstLevelDisposition?.id)
        setSelectedSecondLevel(lead.secondLevelDisposition?.id)
      }
    } else {
      form.resetFields()
      setSelectedFirstLevel(undefined)
      setSelectedSecondLevel(undefined)
    }
  }, [visible, lead, form])

  useEffect(() => {
    // Check if we need to show third level based on disposition names
    const firstLevelName = firstLevelDispositions.find(d => d.id === selectedFirstLevel)?.name
    const secondLevelName = secondLevelDispositions.find(d => d.id === selectedSecondLevel)?.name
    
    if (firstLevelName === 'Not Contacted' || secondLevelName === 'No Sale') {
      const category = firstLevelName === 'Not Contacted' ? 'not_contacted' : 'no_sale'
      fetchThirdLevelDispositions(category)
    } else {
      setThirdLevelDispositions([])
      form.setFieldValue('thirdLevelDispositionId', undefined)
    }
  }, [selectedFirstLevel, selectedSecondLevel, firstLevelDispositions, secondLevelDispositions, form])

  const fetchFirstLevelDispositions = async () => {
    try {
      const data: any = await api.get('/admin/dispositions/first-level')
      setFirstLevelDispositions(data?.data || data || [])
    } catch (error: any) {
      console.error('Error fetching first level dispositions:', error)
      message.error(error?.message || 'Failed to load dispositions')
    }
  }

  const fetchSecondLevelDispositions = async () => {
    try {
      const data: any = await api.get('/admin/dispositions/second-level')
      setSecondLevelDispositions(data?.data || data || [])
    } catch (error: any) {
      console.error('Error fetching second level dispositions:', error)
      message.error(error?.message || 'Failed to load sale dispositions')
    }
  }

  const fetchThirdLevelDispositions = async (category: string) => {
    try {
      const data: any = await api.get(`/admin/dispositions/third-level?category=${category}`)
      setThirdLevelDispositions(data?.data || data || [])
    } catch (error: any) {
      console.error('Error fetching third level dispositions:', error)
      message.error(error?.message || 'Failed to load disposition reasons')
    }
  }

  const handleFirstLevelChange = (value: string) => {
    setSelectedFirstLevel(value)
    form.setFieldValue('secondLevelDispositionId', undefined)
    form.setFieldValue('thirdLevelDispositionId', undefined)
    setSelectedSecondLevel(undefined)
  }

  const handleSecondLevelChange = (value: string) => {
    setSelectedSecondLevel(value)
    form.setFieldValue('thirdLevelDispositionId', undefined)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)

      // Log the values being sent for debugging
      console.log('Submitting disposition:', values)

      const response = await api.put(`/admin/leads/${lead?.id}/disposition`, values)

      message.success('Call disposition saved successfully!')
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Disposition save error:', error)
      if (error.errorFields) {
        message.error('Please fill in all required fields')
      } else {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to save disposition'
        message.error(errorMessage)
        console.error('API Error Details:', error.response?.data)
      }
    } finally {
      setLoading(false)
    }
  }

  const firstLevelName = firstLevelDispositions.find(d => d.id === selectedFirstLevel)?.name
  const secondLevelName = secondLevelDispositions.find(d => d.id === selectedSecondLevel)?.name
  
  const showSecondLevel = firstLevelName === 'Contacted'
  const showThirdLevel = 
    (firstLevelName === 'Not Contacted') || 
    (secondLevelName === 'No Sale')

  return (
    <Modal
      title={
        <Space>
          <PhoneOutlined />
          <span>Call Lead - {lead?.fullName}</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
    >
      {lead && (
        <>
          <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space>
                <div><Text strong>Phone:</Text> {lead.phoneNumber}</div>
                <Button
                  type="default"
                  icon={<CopyOutlined />}
                  onClick={handleCopyNumber}
                  size="small"
                >
                  Copy Number
                </Button>
              </Space>
              <div><Text strong>Sector:</Text> {lead.businessSector.name}</div>
              <div><Text strong>Products:</Text> {lead.products.map(p => p.name).join(', ')}</div>
              {lead.campaign && <div><Text strong>Campaign:</Text> {lead.campaign.campaign_name}</div>}
              {lead.lastCalledAt && (
                <div><Text strong>Last Called:</Text> {new Date(lead.lastCalledAt).toLocaleString()}</div>
              )}
            </Space>
          </div>

          <Divider>Call Disposition</Divider>

          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              name="firstLevelDispositionId"
              label="1. Contact Status"
              rules={[{ required: true, message: 'Please select contact status' }]}
            >
              <Select
                placeholder="Was the lead contacted?"
                onChange={handleFirstLevelChange}
                size="large"
              >
                {firstLevelDispositions.map(d => (
                  <Select.Option key={d.id} value={d.id}>
                    {d.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            {showSecondLevel && (
              <Form.Item
                name="secondLevelDispositionId"
                label="2. Sale Status"
                rules={[{ required: true, message: 'Please select sale status' }]}
              >
                <Select
                  placeholder="Did the lead convert to a sale?"
                  onChange={handleSecondLevelChange}
                  size="large"
                >
                  {secondLevelDispositions.map(d => (
                    <Select.Option key={d.id} value={d.id}>
                      {d.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            )}

            {showThirdLevel && thirdLevelDispositions.length > 0 && (
              <Form.Item
                name="thirdLevelDispositionId"
                label={`3. ${selectedFirstLevel === 'not_contacted' ? 'Reason for Not Contacted' : 'Reason for No Sale'}`}
                rules={[{ required: true, message: 'Please select a reason' }]}
              >
                <Select
                  placeholder="Select reason"
                  size="large"
                >
                  {thirdLevelDispositions.map(d => (
                    <Select.Option key={d.id} value={d.id}>
                      {d.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            )}

            <Form.Item name="dispositionNotes" label="Notes">
              <TextArea rows={4} placeholder="Add any additional notes..." />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Save Disposition
                </Button>
                <Button onClick={onClose}>
                  Cancel
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </>
      )}
    </Modal>
  )
}
