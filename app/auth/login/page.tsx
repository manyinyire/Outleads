'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Form, Input, Button, Card, Typography, App, Layout } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { RootState, AppDispatch } from '@/lib/store'
import { getDashboardRouteForRole } from '@/lib/auth/auth-utils';
import { login, clearError } from '@/lib/store/slices/authSlice'
import Image from 'next/image'
import FirstLoginDialog from '@/components/auth/FirstLoginDialog'
import axios from 'axios'

const { Text } = Typography
const { Content } = Layout

export default function LoginPage() {
  const [form] = Form.useForm()
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const { message } = App.useApp()
  
  const { status, error, isAuthenticated, user } = useSelector((state: RootState) => state.auth)
  const [isFirstLogin, setIsFirstLogin] = useState(false)
  const [newUser, setNewUser] = useState<any>(null)

  useEffect(() => {
    if (isAuthenticated && user) {
      const redirectUrl = getDashboardRouteForRole(user.role);
      router.push(redirectUrl);
    }
  }, [isAuthenticated, user, router])

  useEffect(() => {
    if (error) {
      message.error(error)
      dispatch(clearError())
    }
  }, [error, dispatch, message])

  const handleSubmit = async (values: { username: string; password: string }) => {
    try {
      const response = await axios.post('/api/auth/login', values);
      if (response.data.newUser) {
        setNewUser(response.data.user);
        setIsFirstLogin(true);
      } else {
        // Dispatch login to set user in redux state
        const loggedInUser = response.data.user;
        dispatch(login.fulfilled(loggedInUser, '', { username: values.username, password: values.password }));
        localStorage.setItem('auth-token', response.data.token);
        const redirectUrl = getDashboardRouteForRole(loggedInUser.role);
        router.push(redirectUrl);
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || 'An unknown error occurred.');
    }
  }

  const handleRoleSelection = async (values: { role: string }) => {
    if (!newUser) return;
    
    try {
      await axios.post('/api/auth/complete-registration', { userId: newUser.id, role: values.role });
      setIsFirstLogin(false);
      message.success('Your access request has been submitted. You will be notified once it is approved.');
    } catch (error: any) {
      message.error(error.response?.data?.message || 'An error occurred.');
    }
  }

  return (
    <>
      <Layout style={{ minHeight: '100vh', background: 'linear-gradient(to right, #2A4D74, #6ED0F6)' }}>
        <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
          <Card
            style={{
              width: '100%',
              maxWidth: '400px',
              borderRadius: '1rem',
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
              padding: '2rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
              <Image src="/logos/logo.png" alt="Company Logo" width={150} height={150} />
            </div>

            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              requiredMark={false}
            >
              <Form.Item
                name="username"
                label={<Text style={{ color: '#333333' }}>Username</Text>}
                rules={[
                  { required: true, message: 'Please enter your username' }
                ]}
              >
                <Input
                  prefix={<UserOutlined style={{ color: '#6ED0F6' }} />}
                  placeholder="Enter your username"
                  size="large"
                  style={{ borderRadius: '0.5rem' }}
                />
              </Form.Item>

              <Form.Item
                name="password"
                label={<Text style={{ color: '#333333' }}>Password</Text>}
                rules={[{ required: true, message: 'Please enter your password' }]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: '#6ED0F6' }} />}
                  placeholder="Enter your password"
                  size="large"
                  style={{ borderRadius: '0.5rem' }}
                />
              </Form.Item>

              <Form.Item style={{ marginTop: '1.5rem' }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  block
                  loading={status === 'loading'}
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
                  Sign In
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Content>
      </Layout>
      {newUser && (
        <FirstLoginDialog
          visible={isFirstLogin}
          user={newUser}
          onFinish={handleRoleSelection}
          onCancel={() => setIsFirstLogin(false)}
        />
      )}
    </>
  )
}