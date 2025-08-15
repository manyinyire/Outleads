'use client'

import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@/lib/store'
import { login } from '@/lib/store/slices/authSlice'
import { Card, Form, Input, Button, Alert, Typography, Space } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

export default function DevLoginPage() {
  const dispatch = useDispatch<AppDispatch>()
  const { loading, error, isAuthenticated, user } = useSelector((state: RootState) => state.auth)
  const [form] = Form.useForm()

  const onFinish = async (values: { username: string; password: string }) => {
    try {
      await dispatch(login(values)).unwrap()
      // Redirect to admin page on success
      window.location.href = '/admin'
    } catch (error) {
      console.error('Login failed:', error)
    }
  }

  const quickLogin = (username: string) => {
    form.setFieldsValue({ username, password: 'test123' })
    onFinish({ username, password: 'test123' })
  }

  if (isAuthenticated) {
    return (
      <div style={{ padding: '24px', maxWidth: '400px', margin: '0 auto' }}>
        <Card>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Title level={3}>Already Logged In</Title>
            <Text>Welcome, {user?.name}!</Text>
            <Text>Role: {user?.role}</Text>
            <Button type="primary" onClick={() => window.location.href = '/admin'}>
              Go to Admin
            </Button>
            <Button onClick={() => window.location.href = '/test-auth'}>
              Test Auth
            </Button>
          </Space>
        </Card>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px', maxWidth: '400px', margin: '0 auto' }}>
      <Card>
        <Title level={2} style={{ textAlign: 'center', marginBottom: '24px' }}>
          Development Login
        </Title>

        {error && (
          <Alert
            message="Login Failed"
            description={error}
            type="error"
            style={{ marginBottom: '16px' }}
          />
        )}

        <Form
          form={form}
          name="login"
          onFinish={onFinish}
          layout="vertical"
        >
          <Form.Item
            name="username"
            label="Username"
            rules={[{ required: true, message: 'Please input your username!' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Username" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Password" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Log In
            </Button>
          </Form.Item>
        </Form>

        <div style={{ marginTop: '16px' }}>
          <Text strong>Quick Login (Dev Mode):</Text>
          <Space direction="vertical" style={{ width: '100%', marginTop: '8px' }}>
            <Button size="small" onClick={() => quickLogin('admin')} block>
              Admin (admin/test123)
            </Button>
            <Button size="small" onClick={() => quickLogin('supervisor')} block>
              Supervisor (supervisor/test123)
            </Button>
            <Button size="small" onClick={() => quickLogin('test')} block>
              Agent (test/test123)
            </Button>
          </Space>
        </div>

        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Development mode is enabled. Use the credentials above or any username with password 'test123'
          </Text>
        </div>
      </Card>
    </div>
  )
}