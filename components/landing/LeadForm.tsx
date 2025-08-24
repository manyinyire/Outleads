'use client'

import { Form, Input, Select, Button, Card, Typography, message, Checkbox } from 'antd'
import { UserOutlined, PhoneOutlined, BankOutlined } from '@ant-design/icons'
import { useState, useEffect } from 'react'

const { Title } = Typography
const { Option } = Select

interface Sector {
  id: string;
  name: string;
}

interface LeadFormProps {
  readonly campaignId?: string | null
  readonly onNext?: (formData: any) => void
  readonly initialData?: any
}

export default function LeadForm({ campaignId, onNext, initialData }: LeadFormProps) {
  const [form] = Form.useForm()
  const [sectors, setSectors] = useState<Sector[]>([])
  const [loadingSectors, setLoadingSectors] = useState(true)
  const [submitting] = useState(false)

  useEffect(() => {
    const fetchSectors = async () => {
      try {
        const response = await fetch('/api/sectors')
        if (!response.ok) throw new Error('Failed to fetch sectors')
        const data = await response.json()
        setSectors(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('Failed to fetch sectors:', error)
        message.error('Failed to load business sectors.')
      } finally {
        setLoadingSectors(false)
      }
    }
    fetchSectors()
  }, [])

  // Set initial form data, including the campaignId
  useEffect(() => {
    const initialValues = initialData ? { ...initialData } : {};
    if (campaignId) {
      initialValues.campaignId = campaignId;
    }
    form.setFieldsValue(initialValues);
  }, [initialData, campaignId, form]);

  const handleSubmit = (values: any) => {
    if (onNext) {
      onNext(values);
    }
  };

  return (
    <Card
      style={{
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        border: 'none',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
      }}
    >
      

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        requiredMark={false}
      >
        {/* Hidden field to store campaignId */}
        <Form.Item name="campaignId" hidden>
          <Input />
        </Form.Item>

        <Form.Item
          name="fullName"
          label="Full Name"
          rules={[{ required: true, message: 'Please enter your full name' }]}
        >
          <Input
            prefix={<UserOutlined style={{ color: '#6ED0F6' }} />}
            placeholder="Enter your full name"
            size="large"
            style={{ borderRadius: '0.5rem' }}
          />
        </Form.Item>

        <Form.Item
          name="phoneNumber"
          label="Phone Number"
          rules={[{ required: true, message: 'Please enter your phone number' }]}
        >
          <Input
            prefix={<PhoneOutlined style={{ color: '#6ED0F6' }} />}
            placeholder="Enter your phone number"
            size="large"
            style={{ borderRadius: '0.5rem' }}
          />
        </Form.Item>

        <Form.Item
          name="sectorId"
          label="Business Sector"
          rules={[{ required: true, message: 'Please select your business sector' }]}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            border: '1px solid #d9d9d9',
            borderRadius: '0.5rem',
            backgroundColor: 'white',
          }}>
            <BankOutlined style={{ color: '#6ED0F6', margin: '0 11px' }} />
            <Select
              placeholder="Select your business sector"
              size="large"
              loading={loadingSectors}
              bordered={false}
              style={{ width: '100%' }}
            >
              {sectors.map(sector => (
                <Option key={sector.id} value={sector.id}>
                  {sector.name}
                </Option>
              ))}
            </Select>
          </div>
        </Form.Item>

        <Form.Item
          name="consent"
          valuePropName="checked"
          rules={[
            { 
              validator: (_, value) => 
                value ? Promise.resolve() : Promise.reject(new Error('You must accept the terms and conditions')) 
            }
          ]}
        >
          <Checkbox>
            I agree to be contacted about FBC Holdings products and promotions.
          </Checkbox>
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            loading={submitting}
            style={{ 
              backgroundColor: '#2A4D74', 
              borderColor: '#2A4D74', 
              color: '#FFFFFF', 
              borderRadius: '0.5rem', 
              height: '3rem', 
              fontSize: '1rem', 
              fontWeight: 'bold' 
            }}
          >
            Next: Choose Products
          </Button>
        </Form.Item>
      </Form>
    </Card>
  )
}