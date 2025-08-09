'use client'

import { Form, Input, Select, Button, Card, Typography, message } from 'antd'
import { UserOutlined, PhoneOutlined, BankOutlined } from '@ant-design/icons'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/store'
import { useState } from 'react'

const { Title } = Typography
const { Option } = Select

interface LeadFormProps {
  campaignId?: string | null
}

export default function LeadForm({ campaignId }: LeadFormProps) {
  const [form] = Form.useForm()
  const { businessSectors, selectedProducts, products } = useSelector((state: RootState) => state.landing)
  const [submitting, setSubmitting] = useState(false)

  const selectedProductIds = products
    .filter(p => selectedProducts.includes(p.id))
    .map(p => p.id)

  const selectedProductNames = products
    .filter(p => selectedProducts.includes(p.id))
    .map(p => p.name)

  const handleSubmit = async (values: any) => {
    if (selectedProducts.length === 0) {
      message.warning('Please select at least one product you are interested in.')
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: values.fullName,
          email: values.email,
          phone: values.phoneNumber,
          company: values.businessSector,
          productIds: selectedProductIds,
          campaignId: campaignId || undefined,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit lead')
      }

      message.success('Thank you! Your information has been submitted successfully. Our team will contact you soon.')
      form.resetFields()
    } catch (error) {
      message.error('Failed to submit your information. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

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
        <Form.Item
          name="fullName"
          label="Full Name"
          rules={[
            { required: true, message: 'Please enter your full name' },
            { min: 2, message: 'Name must be at least 2 characters' }
          ]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="Enter your full name"
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="email"
          label="Email Address"
          rules={[
            { required: true, message: 'Please enter your email address' },
            { type: 'email', message: 'Please enter a valid email address' }
          ]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="Enter your email address"
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="phoneNumber"
          label="Phone Number"
          rules={[
            { required: true, message: 'Please enter your phone number' },
            { pattern: /^[\+]?[1-9][\d]{0,15}$/, message: 'Please enter a valid phone number' }
          ]}
        >
          <Input
            prefix={<PhoneOutlined />}
            placeholder="Enter your phone number"
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="businessSector"
          label="Business Sector"
          rules={[{ required: true, message: 'Please select your business sector' }]}
        >
          <Select
            placeholder="Select your business sector"
            size="large"
            suffixIcon={<BankOutlined />}
          >
            {businessSectors.map(sector => (
              <Option key={sector.id} value={sector.name}>
                {sector.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {selectedProducts.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <Typography.Text strong>Selected Products:</Typography.Text>
            <div style={{ marginTop: '8px' }}>
              {selectedProductNames.map((name, index) => (
                <span
                  key={index}
                  style={{
                    display: 'inline-block',
                    background: '#e6f7ff',
                    color: '#1890ff',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    marginRight: '8px',
                    marginBottom: '4px',
                  }}
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            loading={submitting}
            style={{
              height: '48px',
              fontSize: '16px',
              fontWeight: 'bold',
            }}
          >
            Submit Information
          </Button>
        </Form.Item>
      </Form>

      {campaignId && (
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
            Campaign ID: {campaignId}
          </Typography.Text>
        </div>
      )}
    </Card>
  )
}
