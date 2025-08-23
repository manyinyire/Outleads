'use client'

import { useState, useEffect } from 'react'
import { Card, Tabs, Form, Input, Button, message, Spin, Switch } from 'antd'
import type { TabsProps } from 'antd'

const { TabPane } = Tabs

const SettingsPage = () => {
  const [loading, setLoading] = useState(true)
  const [form] = Form.useForm()

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true)
      try {
        const token = localStorage.getItem('auth-token')
        const response = await fetch('/api/admin/settings', {
          headers: { 'Authorization': `Bearer ${token}` },
        })
        if (!response.ok) throw new Error('Failed to fetch settings')
        const data = await response.json()
        const settingsMap = data.reduce((acc: any, setting: any) => {
          acc[setting.key] = setting.value
          return acc
        }, {})
        form.setFieldsValue(settingsMap)
      } catch (error) {
        console.error('Error fetching settings:', error)
        message.error('Failed to load settings.')
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [form])

  const handleSave = async (values: any) => {
    try {
      const token = localStorage.getItem('auth-token')
      for (const key in values) {
        await fetch('/api/admin/settings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ key, value: values[key] }),
        })
      }
      message.success('Settings saved successfully!')
    } catch (error) {
      console.error('Error saving settings:', error)
      message.error('Failed to save settings.')
    }
  }

  const items: TabsProps['items'] = [
    {
      key: '1',
      label: 'General',
      children: (
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="site_title" label="Site Title">
            <Input />
          </Form.Item>
          <Form.Item name="site_tagline" label="Site Tagline">
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Save General Settings
            </Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: '2',
      label: 'User Management',
      children: (
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="allow_registration" label="Allow New User Registration" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="default_user_role" label="Default Role for New Users">
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Save User Settings
            </Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: '3',
      label: 'Notifications',
      children: (
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="admin_email" label="Admin Email for Notifications">
            <Input type="email" />
          </Form.Item>
          <Form.Item name="send_new_lead_notifications" label="Send Notification for New Leads" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Save Notification Settings
            </Button>
          </Form.Item>
        </Form>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <Card title="Application Settings">
      <Tabs defaultActiveKey="1" items={items} />
    </Card>
  )
}

export default SettingsPage