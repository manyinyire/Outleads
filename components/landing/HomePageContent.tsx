'use client'

import { Layout, Row, Col, Tabs, Typography, Button, Steps, Card, Select } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import ProductList from '@/components/landing/ProductList'
import LeadForm from '@/components/landing/LeadForm'
import { useIsMobile } from '@/hooks/use-mobile'
import Image from 'next/image'
import { useLeadForm } from '@/hooks/useLeadForm'

const { Content } = Layout
const { Title, Paragraph } = Typography

// --- TYPE DEFINITIONS ---
interface Product {
  id: string;
  name: string;
  description?: string;
}

interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  products: Product[];
}

interface HomePageContentProps {
  initialCategories: ProductCategory[];
}

export function HomePageContent({ initialCategories }: HomePageContentProps) {
  const {
    currentStep,
    contactFormData,
    campaignId,
    selectedCategoryKey,
    selectedProducts,
    submitting,
    handleContactInfoNext,
    handleBackToContactInfo,
    handleCategoryChange,
    handleProductSelect,
    handleFinalSubmit,
  } = useLeadForm(initialCategories);

  const isMobile = useIsMobile();

  const steps = [
    { title: 'Contact Information', description: 'Tell us about yourself' },
    { title: 'Select Product(s)', description: 'Choose your financial solutions' }
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: 'linear-gradient(to right, #2A4D74, #6ED0F6)' }}>
      <Content style={{ padding: isMobile ? '1rem' : '2rem' }}>
        <Row justify="center" align="middle" style={{ minHeight: '100%' }}>
          <Col xs={24} sm={20} md={18} lg={16} xl={14}>
            <Card 
              style={{ 
                borderRadius: '1rem', 
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)', 
                padding: isMobile ? '1rem' : '2rem',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
                <Image src="/logos/logo.png" alt="Nexus Financial Services" width={150} height={150} style={{ objectFit: 'contain' }} />
                <Paragraph style={{ fontSize: '1rem', color: '#333333', marginTop: '1rem', textAlign: 'center' }}>
                  Discover our comprehensive range of financial solutions tailored for your business needs.
                </Paragraph>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <Steps 
                  current={currentStep} 
                  items={steps} 
                  direction={isMobile ? 'vertical' : 'horizontal'}
                />
              </div>

              {currentStep === 0 && (
                <LeadForm 
                  campaignId={campaignId} 
                  onNext={handleContactInfoNext}
                  initialData={contactFormData}
                />
              )}

              {currentStep === 1 && (
                <>
                  <Card variant="borderless" style={{ backgroundColor: '#F0F0F0', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <Title level={5} style={{ margin: 0, color: '#2A4D74' }}>
                          Contact Information
                        </Title>
                        <Paragraph style={{ margin: 0, color: '#333333' }}>
                          {contactFormData?.fullName} | {contactFormData?.phoneNumber}
                        </Paragraph>
                      </div>
                      <Button 
                        type="link" 
                        icon={<ArrowLeftOutlined />}
                        onClick={handleBackToContactInfo}
                        style={{ color: '#2A4D74' }}
                      >
                        Edit
                      </Button>
                    </div>
                  </Card>

                  {isMobile && initialCategories ? (
                    <>
                      <Select
                        value={selectedCategoryKey}
                        onChange={handleCategoryChange}
                        style={{ width: '100%', marginBottom: '1rem' }}
                      >
                        {initialCategories.map(category => (
                          <Select.Option key={category.id} value={category.id}>
                            {category.name}
                          </Select.Option>
                        ))}
                      </Select>
                      <ProductList
                        products={initialCategories.find(c => c.id === selectedCategoryKey)?.products || []}
                        selectedProductIds={selectedProducts.map(p => p.id)}
                        onProductSelect={handleProductSelect}
                      />
                    </>
                  ) : (
                    <Tabs
                      activeKey={selectedCategoryKey}
                      onChange={handleCategoryChange}
                      items={initialCategories.map(category => ({
                        key: category.id,
                        label: <span style={{ color: '#2A4D74' }}>{category.name}</span>,
                        children: (
                          <ProductList
                            products={category.products}
                            selectedProductIds={selectedProducts.map(p => p.id)}
                            onProductSelect={handleProductSelect}
                          />
                        )
                      }))}
                    />
                  )}

                  {selectedProducts.length > 0 && (
                    <div style={{ marginTop: '2rem' }}>
                      <Card variant="borderless" style={{ backgroundColor: '#F0F0F0', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
                        <Title level={5} style={{ margin: 0, color: '#2A4D74' }}>
                          Selected Products:
                        </Title>
                        <ul style={{ paddingLeft: '1.5rem', margin: '0.5rem 0 0', color: '#333333' }}>
                          {selectedProducts.map(p => <li key={p.id}>{p.name}</li>)}
                        </ul>
                      </Card>
                      <Button
                        type="primary"
                        size="large"
                        block
                        loading={submitting}
                        onClick={handleFinalSubmit}
                        style={{ backgroundColor: '#2A4D74', borderColor: '#2A4D74', color: '#FFFFFF', borderRadius: '0.5rem', height: '3rem', fontSize: '1rem', fontWeight: 'bold' }}
                      >
                        Complete Registration
                      </Button>
                    </div>
                  )}
                </>
              )}
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  )
}
