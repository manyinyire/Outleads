'use client'

import { useEffect, useState, Suspense } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'next/navigation'
import { Layout, Row, Col, Tabs, Card, Typography, Descriptions, Drawer, Button } from 'antd'
import { MenuOutlined } from '@ant-design/icons'
import { RootState, AppDispatch } from '@/lib/store'
import { setSelectedCategory } from '@/lib/store/slices/landingSlice'
import { useIsMobile } from '@/hooks/use-mobile'
import ProductList from '@/components/landing/ProductList'
import LeadForm from '@/components/landing/LeadForm'

const { Content } = Layout
const { Title, Paragraph } = Typography

const categoryGradients = {
  finance: 'gradient-bg-finance',
  insurance: 'gradient-bg-insurance',
  investment: 'gradient-bg-investment',
  banking: 'gradient-bg-banking',
}

function HomePageContent() {
  const dispatch = useDispatch<AppDispatch>()
  const searchParams = useSearchParams()
  const [drawerVisible, setDrawerVisible] = useState(false)
  const isMobile = useIsMobile()
  
  const { products, selectedCategory, loading } = useSelector((state: RootState) => state.landing)
  
  const campaignId = searchParams.get('campaign')

  // Products are fetched by the ProductList component

  const categories = [
    { key: 'finance', label: 'Finance', icon: '💰' },
    { key: 'insurance', label: 'Insurance', icon: '🛡️' },
    { key: 'investment', label: 'Investment', icon: '📈' },
    { key: 'banking', label: 'Banking', icon: '🏦' },
  ]

  const selectedCategoryProducts = (products || []).filter(p => p.category === selectedCategory)
  const selectedCategoryInfo = categories.find(c => c.key === selectedCategory)

  const handleCategoryChange = (key: string) => {
    dispatch(setSelectedCategory(key))
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ padding: 0 }}>
        <Row style={{ minHeight: '100vh' }}>
          {/* Left Panel - Product Selection */}
          <Col xs={24} md={12} style={{ padding: '24px', backgroundColor: '#f8f9fa' }}>
            <div style={{ marginBottom: '24px' }}>
              <Title level={2} style={{ color: '#1f2937', marginBottom: '8px' }}>
                Nexus Financial Services
              </Title>
              <Paragraph style={{ fontSize: '16px', color: '#6b7280' }}>
                Discover our comprehensive range of financial solutions tailored for your business needs.
              </Paragraph>
            </div>

            <Tabs
              activeKey={selectedCategory}
              onChange={handleCategoryChange}
              items={categories.map(category => ({
                key: category.key,
                label: (
                  <span>
                    <span style={{ marginRight: '8px' }}>{category.icon}</span>
                    {category.label}
                  </span>
                ),
                children: <ProductList />
              }))}
            />

            {/* Mobile Product Details Button */}
            {isMobile && (
              <div style={{ marginTop: '24px' }}>
                <Button
                  type="primary"
                  icon={<MenuOutlined />}
                  onClick={() => setDrawerVisible(true)}
                  block
                  size="large"
                >
                  View {selectedCategoryInfo?.label} Details
                </Button>
              </div>
            )}

            {/* Lead Form */}
            <div style={{ marginTop: '32px' }}>
              <LeadForm campaignId={campaignId} />
            </div>
          </Col>

          {/* Right Panel - Product Details (Desktop) */}
          {!isMobile && (
            <Col xs={0} md={12}>
            <div 
              className={categoryGradients[selectedCategory as keyof typeof categoryGradients]}
              style={{ 
                height: '100vh', 
                padding: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Card
                style={{
                  maxWidth: '500px',
                  width: '100%',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  border: 'none',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                }}
              >
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                    {selectedCategoryInfo?.icon}
                  </div>
                  <Title level={2} style={{ color: '#1f2937', marginBottom: '8px' }}>
                    {selectedCategoryInfo?.label} Solutions
                  </Title>
                  <Paragraph style={{ fontSize: '16px', color: '#6b7280' }}>
                    Professional financial services designed to help your business thrive and grow.
                  </Paragraph>
                </div>

                <Descriptions column={1} bordered size="small">
                  <Descriptions.Item label="Available Products">
                    {selectedCategoryProducts.length} products
                  </Descriptions.Item>
                  <Descriptions.Item label="Industry Focus">
                    All business sectors
                  </Descriptions.Item>
                  <Descriptions.Item label="Support">
                    24/7 dedicated support
                  </Descriptions.Item>
                  <Descriptions.Item label="Processing Time">
                    Fast approval process
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </div>
            </Col>
          )}
        </Row>

        {/* Mobile Drawer for Product Details */}
        <Drawer
          title={`${selectedCategoryInfo?.label} Solutions`}
          placement="bottom"
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
          height="60vh"
        >
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>
              {selectedCategoryInfo?.icon}
            </div>
            <Title level={3} style={{ color: '#1f2937', marginBottom: '8px' }}>
              {selectedCategoryInfo?.label} Solutions
            </Title>
            <Paragraph style={{ fontSize: '16px', color: '#6b7280' }}>
              Professional financial services designed to help your business thrive and grow.
            </Paragraph>
          </div>

          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Available Products">
              {selectedCategoryProducts.length} products
            </Descriptions.Item>
            <Descriptions.Item label="Industry Focus">
              All business sectors
            </Descriptions.Item>
            <Descriptions.Item label="Support">
              24/7 dedicated support
            </Descriptions.Item>
            <Descriptions.Item label="Processing Time">
              Fast approval process
            </Descriptions.Item>
          </Descriptions>
        </Drawer>
      </Content>
    </Layout>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomePageContent />
    </Suspense>
  )
}
