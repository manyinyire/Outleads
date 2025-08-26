'use client'

import { useState, useEffect, useMemo } from 'react'
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
import Image from 'next/image'

const { Header, Sider, Content } = Layout
const { Text, Title } = Typography

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const dispatch = useDispatch<AppDispatch>()
  
  const { user, status } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    if (status === 'failed') {
      router.push('/auth/login')
    }
  }, [status, router])

  const handleLogout = async () => {
    try {
      await dispatch(logout() as any)
    } finally {
      router.replace('/auth/login')
    }
  }

  const hasAnyRole = (u: { role: string } | null, roles: string[]) =>
    !!u && roles.includes(u.role)

  function getSelectedKey(path: string, items: { key: string }[]) {
    const keys = items.map(i => i.key)
    const match = keys
      .filter(k => path === k || path.startsWith(k + '/'))
      .sort((a, b) => b.length - a.length)[0]
    return match ?? keys[0]
  }

  const menuItems = useMemo(() => [
    {
      key: '/admin',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
      hidden: !hasAnyRole(user, ['ADMIN', 'SUPERVISOR']),
    },
    {
      key: '/admin/leads',
      icon: <UserOutlined />,
      label: 'Leads',
      hidden: !hasAnyRole(user, ['ADMIN', 'AGENT', 'SUPERVISOR']),
    },
    {
      key: '/admin/campaigns',
      icon: <BulbOutlined />,
      label: 'Campaigns',
      hidden: !hasAnyRole(user, ['ADMIN', 'SUPERVISOR', 'AGENT']),
    },
    {
      key: '/admin/reports',
      icon: <BarChartOutlined />,
      label: 'Reports',
      hidden: !hasAnyRole(user, ['ADMIN', 'SUPERVISOR']),
    },
    {
      key: '/admin/users',
      icon: <TeamOutlined />,
      label: 'Users',
      hidden: !hasAnyRole(user, ['ADMIN', 'BSS', 'INFOSEC']),
    },
    {
      key: '/admin/products',
      icon: <ShoppingOutlined />,
      label: 'Products',
      hidden: !hasAnyRole(user, ['ADMIN']),
    },
    {
      key: '/admin/product-categories',
      icon: <AppstoreOutlined />,
      label: 'Categories',
      hidden: !hasAnyRole(user, ['ADMIN']),
    },
    {
      key: '/admin/sectors',
      icon: <AppstoreOutlined />,
      label: 'Sectors',
      hidden: !hasAnyRole(user, ['ADMIN']),
    },
    
    {
      key: '/admin/sbus',
      icon: <BankOutlined />,
      label: 'SBUs',
      hidden: !hasAnyRole(user, ['ADMIN']),
    },
    {
      key: '/admin/settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      hidden: !hasAnyRole(user, ['ADMIN']),
    },
  ].filter(item => !item.hidden), [user])

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

  if (status === 'loading' || status === 'idle') {
    return (
      <Layout style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0F0F0' }}>
        <Spin size="large" tip="Loading admin…" />
      </Layout>
    )
  }

  if (status === 'succeeded' && user) {
    const siderWidth = collapsed ? 80 : 250;
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          collapsedWidth={80}
          breakpoint="lg"
          style={{
            background: '#2A4D74',
            boxShadow: '2px 0 6px rgba(0,21,41,0.35)',
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 1000,
          }}
          width={250}
        >
          <div
            style={{
              height: '64px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 1rem',
            }}
          >
            <Image
              src="/logos/logo.png"
              alt="Nexus Logo"
              width={collapsed ? 40 : 150}
              height={collapsed ? 40 : 150}
              priority
            />
          </div>
          
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[getSelectedKey(pathname, menuItems as any)]}
            items={menuItems}
            onClick={({ key }) => router.push(key)}
            style={{ background: '#2A4D74', borderRight: 0 }}
          />
        </Sider>
        
        <Layout style={{ backgroundColor: '#F0F0F0', marginLeft: siderWidth, transition: 'margin-left 0.2s' }}>
          <Header
            style={{
              padding: '0 24px',
              background: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            }}
          >
            <Button
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-pressed={collapsed}
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '1.25rem', color: '#2A4D74' }}
            />
            
            <Dropdown
              menu={{
                items: userMenuItems,
                onClick: ({ key }) => {
                  if (key === 'logout') return handleLogout()
                  if (key === 'profile') return router.push('/admin/profile')
                },
              }}
              placement="bottomRight"
              arrow
              trigger={['click']}
            >
              <Button type="text" style={{ height: 'auto', padding: '0.5rem 1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#6ED0F6', marginRight: '0.75rem' }} />
                  <div>
                    <Text strong style={{ color: '#333333', display: 'block' }}>{user.name}</Text>
                    <Text type="secondary" style={{ display: 'block', lineHeight: 1 }}>
                      {user.role}
                    </Text>
                  </div>
                </div>
              </Button>
            </Dropdown>
          </Header>
          
          <Content
            style={{
              margin: '24px',
              padding: '24px',
              background: '#FFFFFF',
              borderRadius: '1rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              overflow: 'auto',
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

  return (
    <Layout style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0F0F0' }}>
      <Spin size="large" tip="Redirecting…" />
    </Layout>
  )
}
