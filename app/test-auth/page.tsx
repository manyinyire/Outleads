'use client'

import { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '@/lib/store'
import { checkAuthStatus, logoutAsync } from '@/lib/store/slices/authSlice'
import { Button, Card, Typography, Space, Alert } from 'antd'

const { Title, Text } = Typography

export default function TestAuthPage() {
  const dispatch = useDispatch<AppDispatch>()
  const { user, isAuthenticated, status, error } = useSelector((state: RootState) => state.auth)
  const loading = status === 'loading'
  const [testResult, setTestResult] = useState<string | null>(null)

  const testLeadsAPI = async () => {
    try {
      setTestResult('Testing...')
      const response = await fetch('/api/admin/leads', {
        credentials: 'include',
      })
      
      if (response.ok) {
        const data = await response.json()
        setTestResult(`Success! Found ${data.length} leads`)
      } else {
        const errorData = await response.json()
        setTestResult(`Failed: ${response.status} - ${errorData.message}`)
      }
    } catch (error) {
      setTestResult(`Error: ${(error as Error).message}`)
    }
  }

  const handleLogout = () => {
    dispatch(logoutAsync())
  }

  const handleCheckAuth = () => {
    dispatch(checkAuthStatus())
  }

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Title level={2}>Authentication Test Page</Title>
      
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card title="Auth Status">
          <Space direction="vertical">
            <Text>Loading: {loading ? 'Yes' : 'No'}</Text>
            <Text>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</Text>
            <Text>User: {user ? `${user.name} (${user.role})` : 'None'}</Text>
            {error && <Alert message={error} type="error" />}
          </Space>
        </Card>

        <Card title="Actions">
          <Space>
            <Button onClick={handleCheckAuth} loading={loading}>
              Check Auth Status
            </Button>
            <Button onClick={testLeadsAPI}>
              Test Leads API
            </Button>
            {isAuthenticated && (
              <Button onClick={handleLogout} danger>
                Logout
              </Button>
            )}
          </Space>
        </Card>

        {testResult && (
          <Card title="API Test Result">
            <Text>{testResult}</Text>
          </Card>
        )}

        <Card title="Instructions">
          <Space direction="vertical">
            <Text>1. If not authenticated, go to /login and log in</Text>
            <Text>2. Come back here and click &quot;Check Auth Status&quot;</Text>
            <Text>3. If authenticated, try &quot;Test Leads API&quot;</Text>
            <Text>4. Check the browser console for detailed logs</Text>
          </Space>
        </Card>
      </Space>
    </div>
  )
}