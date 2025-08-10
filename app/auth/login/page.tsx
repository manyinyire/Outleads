'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Form, Input, Button, Card, Typography, message, Layout } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { RootState, AppDispatch } from '@/lib/store'
import { login, clearError } from '@/lib/store/slices/authSlice'

const { Title, Text } = Typography
const { Content } = Layout

export default function LoginPage() {
  const [form] = Form.useForm()
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  
  const { loading, error, isAuthenticated } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/admin')
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    if (error) {
      message.error(error)
      dispatch(clearError())
    }
  }, [error, dispatch])

  const handleSubmit = async (values: { username: string; password: string }) => {
    dispatch(login(values))
  }

  return (
    <Layout style={{ minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
      <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Card
          style={{
            width: '100%',
            maxWidth: '400px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <Title level={2} style={{ color: '#1f2937', marginBottom: '8px' }}>
              Nexus Admin
            </Title>
            <Text type="secondary">
              Sign in to access the admin dashboard
            </Text>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            requiredMark={false}
          >
            <Form.Item
              name="username"
              label="Username"
              rules={[
                { required: true, message: 'Please enter your username' }
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Enter your username"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: 'Please enter your password' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Enter your password"
                size="large"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                loading={loading}
                style={{ height: '48px', fontSize: '16px' }}
              >
                Sign In
              </Button>
            </Form.Item>
          </Form>


        </Card>
      </Content>
    </Layout>
  )
}
