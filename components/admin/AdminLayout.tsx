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

  const handleLogout = () => {
    dispatch(logout())
    router.push('/auth/login')
  }

  const menuItems = [
    {
      key: '/admin',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
      hidden: !user || !['ADMIN', 'SUPERVISOR'].includes(user.role),
    },
    {
      key: '/admin/leads',
      icon: <UserOutlined />,
      label: 'Leads',
      hidden: !user || !['ADMIN', 'AGENT', 'SUPERVISOR'].includes(user.role),
    },
    {
      key: '/admin/campaigns',
      icon: <BulbOutlined />,
      label: 'Campaigns',
      hidden: !user || !['ADMIN', 'SUPERVISOR', 'AGENT'].includes(user.role),
    },
    {
      key: '/admin/reports',
      icon: <BarChartOutlined />,
      label: 'Reports',
      hidden: !user || !['ADMIN', 'SUPERVISOR'].includes(user.role),
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

  if (status === 'loading' || status === 'idle') {
    return (
      <Layout style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0F0F0' }}>
        <Spin size="large" />
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
            <Image src="/logos/logo.png" alt="Nexus Logo" width={150} height={150} />
          </div>
          
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[pathname]}
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
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '1.25rem', color: '#2A4D74' }}
            />
            
            <Dropdown
              menu={{ items: userMenuItems }}
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

  return null;
}
