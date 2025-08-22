'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Layout, Menu, Button, Dropdown, Avatar, Typography, Spin } from 'antd'
import ErrorBoundary from './ErrorBoundary'
import {
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  BarChartOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BulbOutlined,
  FileTextOutlined,
  BankOutlined,
  ShoppingOutlined,
  AppstoreOutlined,
} from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { RootState, AppDispatch } from '@/lib/store'
import { logout } from '@/lib/store/slices/authSlice'

const { Header, Sider, Content } = Layout
const { Text } = Typography

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const dispatch = useDispatch<AppDispatch>()
  
  const { user, status } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    // This effect handles redirection based on auth status
    if (status === 'failed') {
      router.push('/auth/login')
    }
  }, [status, router])

  const handleLogout = () => {
    dispatch(logout())
    router.push('/auth/login')
  }

  const menuItems = [
    {
      key: '/admin',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/admin/leads',
      icon: <UserOutlined />,
      label: 'Leads',
      hidden: !user || !['ADMIN', 'AGENT', 'TEAMLEADER'].includes(user.role),
    },
    {
      key: '/admin/campaigns',
      icon: <BulbOutlined />,
      label: 'Campaigns',
      hidden: !user || user.role !== 'ADMIN',
    },
    {
      key: '/admin/reports',
      icon: <BarChartOutlined />,
      label: 'Reports',
      hidden: !user || user.role !== 'ADMIN',
    },
    {
      key: '/admin/users',
      icon: <TeamOutlined />,
      label: 'Users',
      hidden: !user || !['ADMIN', 'BSS', 'INFOSEC'].includes(user.role),
    },
    {
      key: '/admin/products',
      icon: <ShoppingOutlined />,
      label: 'Products',
      hidden: !user || user.role !== 'ADMIN',
    },
    {
      key: '/admin/product-categories',
      icon: <AppstoreOutlined />,
      label: 'Categories',
      hidden: !user || user.role !== 'ADMIN',
    },
    {
      key: '/admin/sectors',
      icon: <AppstoreOutlined />,
      label: 'Sectors',
      hidden: !user || user.role !== 'ADMIN',
    },
    {
      key: '/admin/sbus',
      icon: <BankOutlined />,
      label: 'SBUs',
      hidden: !user || user.role !== 'ADMIN',
    },
    {
      key: '/admin/settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      hidden: !user || user.role !== 'ADMIN',
    },
  ].filter(item => !item.hidden)

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: handleLogout,
    },
  ]

  // Show a full-page loader while the token is being verified
  if (status === 'loading' || status === 'idle') {
    return (
      <Layout style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" />
      </Layout>
    )
  }

  // If authentication has succeeded and we have a user, render the layout
  if (status === 'succeeded' && user) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          style={{
            background: '#001529',
          }}
        >
          <div
            style={{
              height: '64px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderBottom: '1px solid #1f1f1f',
            }}
          >
            <Text
              style={{
                color: '#fff',
                fontSize: collapsed ? '16px' : '18px',
                fontWeight: 'bold',
              }}
            >
              {collapsed ? 'N' : 'Nexus'}
            </Text>
          </div>
          
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[pathname]}
            items={menuItems}
            onClick={({ key }) => router.push(key)}
          />
        </Sider>
        
        <Layout>
          <Header
            style={{
              padding: '0 24px',
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #f0f0f0',
            }}
          >
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '16px', width: 64, height: 64 }}
            />
            
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
            >
              <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '8px 12px', borderRadius: '6px', transition: 'background-color 0.2s' }}>
                <Avatar icon={<UserOutlined />} style={{ marginRight: '12px' }} />
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                  <Text strong style={{ fontSize: '14px', marginBottom: '2px' }}>{user.name}</Text>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {user.role}
                  </Text>
                </div>
              </div>
            </Dropdown>
          </Header>
          
          <Content
            style={{
              margin: '24px',
              padding: '24px',
              background: '#fff',
              borderRadius: '8px',
              minHeight: 'calc(100vh - 112px)',
            }}
          >
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </Content>
        </Layout>
      </Layout>
    )
  }

  // If status is 'failed', the useEffect will handle the redirect. 
  // You can return null or a minimal loader here.
  return null;
}
