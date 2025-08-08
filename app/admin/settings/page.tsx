'use client'

import { Card, Typography, Form, Input, Button, Switch, Space, Divider } from 'antd'
import { SaveOutlined } from '@ant-design/icons'

const { Title, Text } = Typography
const { TextArea } = Input

export default function SettingsPage() {
  const [form] = Form.useForm()

  const handleSave = (values: any) => {
    console.log('Settings saved:', values)
  }

  return (
    <div>
      <Title level={2} style={{ marginBottom: '24px' }}>
        System Settings
      </Title>

      <Card title="General Settings" style={{ marginBottom: '24px' }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          initialValues={{
            companyName: 'Nexus Financial Services',
            supportEmail: 'support@nexus.com',
            autoAssignLeads: true,
            emailNotifications: true,
          }}
        >
          <Form.Item
            name="companyName"
            label="Company Name"
            rules={[{ required: true, message: 'Please enter company name' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="supportEmail"
            label="Support Email"
            rules={[
              { required: true, message: 'Please enter support email' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="welcomeMessage"
            label="Welcome Message"
          >
            <TextArea rows={4} placeholder="Enter welcome message for new leads" />
          </Form.Item>

          <Divider />

          <Form.Item
            name="autoAssignLeads"
            label="Auto-assign Leads"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="emailNotifications"
            label="Email Notifications"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
              Save Settings
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title="API Configuration">
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong>API Endpoint:</Text>
            <div className="campaign-url-display" style={{ marginTop: '8px' }}>
              https://api.nexus.com/v1/leads
            </div>
          </div>
          <div>
            <Text strong>Webhook URL:</Text>
            <div className="campaign-url-display" style={{ marginTop: '8px' }}>
              https://api.nexus.com/v1/webhooks/leads
            </div>
          </div>
        </Space>
      </Card>
    </div>
  )
}
