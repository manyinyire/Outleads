'use client'

import { useEffect, useState } from 'react'
import { Button, Card, Typography, Space, Alert } from 'antd'
import { clearAuth } from '@/lib/auth/clear-auth'

const { Title, Text, Paragraph } = Typography

export default function DebugAuthPage() {
  const [authData, setAuthData] = useState<any>(null)
  const [landingData, setLandingData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const nexusAuth = localStorage.getItem('nexus-auth')
        const nexusLanding = localStorage.getItem('nexus-landing')
        const token = localStorage.getItem('token')
        
        setAuthData({
          'nexus-auth': nexusAuth ? JSON.parse(nexusAuth) : null,
          'token': token,
        })
        
        setLandingData({
          'nexus-landing': nexusLanding ? JSON.parse(nexusLanding) : null,
        })
      } catch (err) {
        setError('Error reading localStorage data: ' + (err as Error).message)
      }
    }
  }, [])

  const handleClearAuth = () => {
    clearAuth()
    window.location.reload()
  }

  const testApiCall = async () => {
    try {
      const response = await fetch('/api/admin/campaigns', {
        credentials: 'include',
      })
      
      if (response.ok) {
        alert('API call successful!')
      } else {
        const errorData = await response.json()
        alert(`API call failed: ${response.status} - ${errorData.message}`)
      }
    } catch (error) {
      alert(`API call error: ${(error as Error).message}`)
    }
  }

  const testAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      })
      
      if (response.ok) {
        const data = await response.json()
        alert(`Auth status: Authenticated as ${data.user.name}`)
      } else {
        const errorData = await response.json()
        alert(`Auth status: Not authenticated - ${errorData.message}`)
      }
    } catch (error) {
      alert(`Auth status error: ${(error as Error).message}`)
    }
  }

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Title level={2}>Auth Debug Page</Title>
      
      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          style={{ marginBottom: '24px' }}
        />
      )}

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card title="Auth Data in localStorage">
          <pre style={{ background: '#f5f5f5', padding: '12px', borderRadius: '4px' }}>
            {JSON.stringify(authData, null, 2)}
          </pre>
        </Card>

        <Card title="Landing Data in localStorage">
          <pre style={{ background: '#f5f5f5', padding: '12px', borderRadius: '4px' }}>
            {JSON.stringify(landingData, null, 2)}
          </pre>
        </Card>

        <Card title="Actions">
          <Space>
            <Button type="primary" danger onClick={handleClearAuth}>
              Clear All Auth Data
            </Button>
            <Button onClick={testApiCall}>
              Test API Call
            </Button>
            <Button onClick={testAuthStatus}>
              Test Auth Status
            </Button>
            <Button onClick={() => window.location.href = '/admin'}>
              Go to Admin
            </Button>
          </Space>
        </Card>

        <Card title="Instructions">
          <Paragraph>
            1. If you see corrupted data above, click &quot;Clear All Auth Data&quot;
          </Paragraph>
          <Paragraph>
            2. After clearing, you&apos;ll need to log in again
          </Paragraph>
          <Paragraph>
            3. The &quot;Test API Call&quot; button will test if authentication is working
          </Paragraph>
        </Card>
      </Space>
    </div>
  )
}