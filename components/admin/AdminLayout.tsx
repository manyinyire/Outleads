'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Layout, Menu, Button, Dropdown, Avatar, Typography } from 'antd'
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
  const router = useRouter()
  const pathname = usePathname()
  const dispatch = useDispatch<AppDispatch>()
  
  const { user } = useSelector((state: RootState) => state.auth)

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
    },
    {
      key: '/admin/campaigns',
      icon: <BulbOutlined />,
      label: 'Campaigns',
    },
    {
      key: '/admin/reports',
      icon: <BarChartOutlined />,
      label: 'Reports',
    },
    ...(user?.role === 'ADMIN' ? [
      {
        key: '/admin/products',
        icon: <ShoppingOutlined />,
        label: 'Products',
      },
      {
        key: '/admin/sectors',
        icon: <AppstoreOutlined />,
        label: 'Sectors',
      },
      {
        key: '/admin/users',
        icon: <TeamOutlined />,
        label: 'Users',
      },
      {
        key: '/admin/sbus',
        icon: <BankOutlined />,
        label: 'SBUs',
      },
      {
        key: '/admin/settings',
        icon: <SettingOutlined />,
        label: 'Settings',
      },
    ] : []),
  ]

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
            <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} style={{ marginRight: '8px' }} />
              <div>
                <Text strong>{user?.name}</Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {user?.role}
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
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}
