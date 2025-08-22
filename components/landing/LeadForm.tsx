'use client'

import { Form, Input, Select, Button, Card, Typography, message } from 'antd'
import { UserOutlined, PhoneOutlined, BankOutlined } from '@ant-design/icons'
import { useState, useEffect } from 'react'

const { Title } = Typography
const { Option } = Select

interface Sector {
  id: string;
  name: string;
}

interface LeadFormProps {
  campaignId?: string | null
  onNext?: (formData: any) => void
  initialData?: any
}

export default function LeadForm({ campaignId, onNext, initialData }: LeadFormProps) {
  const [form] = Form.useForm()
  const [sectors, setSectors] = useState<Sector[]>([])
  const [loadingSectors, setLoadingSectors] = useState(true)
  const [submitting, setSubmitting] = useState(false)

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
      }}
    >
      <Title level={3} style={{ textAlign: 'center', marginBottom: '24px', color: '#1f2937' }}>
        Get Started Today
      </Title>

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
            prefix={<UserOutlined />}
            placeholder="Enter your full name"
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="phoneNumber"
          label="Phone Number"
          rules={[{ required: true, message: 'Please enter your phone number' }]}
        >
          <Input
            prefix={<PhoneOutlined />}
            placeholder="Enter your phone number"
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="sectorId"
          label="Business Sector"
          rules={[{ required: true, message: 'Please select your business sector' }]}
        >
          <Select
            placeholder="Select your business sector"
            size="large"
            loading={loadingSectors}
            suffixIcon={<BankOutlined />}
          >
            {sectors.map(sector => (
              <Option key={sector.id} value={sector.id}>
                {sector.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            loading={submitting}
            style={{ height: '48px', fontSize: '16px', fontWeight: 'bold' }}
          >
            Next: Choose Products
          </Button>
        </Form.Item>
      </Form>
    </Card>
  )
}