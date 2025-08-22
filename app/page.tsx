'use client'

import { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Layout, Row, Col, Tabs, Card, Typography, Drawer, Button, Steps, message, Spin } from 'antd'
import { MenuOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import ProductList from '@/components/landing/ProductList'
import LeadForm from '@/components/landing/LeadForm'

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

// --- COMPONENT ---
export default function HomePage() {
  const searchParams = useSearchParams()
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([])
  const [contactFormData, setContactFormData] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)
  
  const [categories, setCategories] = useState<ProductCategory[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string>('')

  const campaignIdFromUrl = searchParams.get('campaignId');
  const [campaignId, setCampaignId] = useState<string | null>(null);

  useEffect(() => {
    if (campaignIdFromUrl) {
      localStorage.setItem('campaignId', campaignIdFromUrl);
      setCampaignId(campaignIdFromUrl);
    } else {
      const storedCampaignId = localStorage.getItem('campaignId');
      if (storedCampaignId) {
        setCampaignId(storedCampaignId);
      }
    }
  }, [campaignIdFromUrl]);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/products')
        if (!response.ok) throw new Error('Failed to fetch categories')
        const data = await response.json()
        
        if (Array.isArray(data)) {
          setCategories(data)
          if (data.length > 0) {
            setSelectedCategoryKey(data[0].id)
          }
        } else {
          console.error('API did not return an array for categories:', data);
          setCategories([]);
        }
      } catch (error) {
        console.error("Fetch error:", error)
        message.error('Failed to load product categories.')
        setCategories([]);
      } finally {
        setLoading(false)
      }
    }
    fetchCategories()
  }, [])

  const handleCategoryChange = (key: string) => {
    setSelectedCategoryKey(key)
  }

  const handleContactInfoNext = (formData: any) => {
    setContactFormData(formData)
    setCurrentStep(1)
  }

  const handleProductSelect = (product: Product) => {
    setSelectedProducts(prev => {
      const isSelected = prev.some(p => p.id === product.id);
      if (isSelected) {
        return prev.filter(p => p.id !== product.id);
      } else {
        return [...prev, product];
      }
    });
  }

  const handleBackToContactInfo = () => {
    setCurrentStep(0)
  }

  const handleFinalSubmit = async () => {
    if (!contactFormData || selectedProducts.length === 0) {
      message.warning('Please complete all steps and select at least one product.');
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactFormData.fullName,
          phone: contactFormData.phoneNumber,
          company: contactFormData.sectorId,
          productIds: selectedProducts.map(p => p.id),
          campaignId: campaignId || undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to submit lead')
      }

      message.success('Thank you! Your registration has been completed successfully.')
      setCurrentStep(0)
      setContactFormData(null)
      setSelectedProducts([])
    } catch (error: any) {
      message.error(error.message || 'An error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const steps = [
    { title: 'Contact Information', description: 'Tell us about yourself' },
    { title: 'Select Product(s)', description: 'Choose your financial solutions' }
  ]

  if (loading || !categories) {
    return (
      <Layout style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" />
      </Layout>
    )
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ padding: 0 }}>
        <Row style={{ minHeight: '100vh' }}>
          {/* Left Panel - Multi-step Form */}
          <Col xs={24} md={12} style={{ padding: '24px', backgroundColor: '#f8f9fa' }}>
            <div style={{ marginBottom: '24px' }}>
              <Title level={2} style={{ color: '#1f2937', marginBottom: '8px' }}>
                Nexus Financial Services
              </Title>
              <Paragraph style={{ fontSize: '16px', color: '#6b7280' }}>
                Discover our comprehensive range of financial solutions tailored for your business needs.
              </Paragraph>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <Steps current={currentStep} items={steps} size="small" />
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
                <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <Title level={4} style={{ margin: 0, color: '#1f2937' }}>
                        Contact Information
                      </Title>
                      <Paragraph style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                        {contactFormData?.fullName} | {contactFormData?.phoneNumber}
                      </Paragraph>
                    </div>
                    <Button 
                      type="text" 
                      icon={<ArrowLeftOutlined />}
                      onClick={handleBackToContactInfo}
                    >
                      Edit
                    </Button>
                  </div>
                </div>

                <Tabs
                  activeKey={selectedCategoryKey}
                  onChange={handleCategoryChange}
                  items={categories.map(category => ({
                    key: category.id,
                    label: <span>{category.name}</span>,
                    children: (
                      <ProductList 
                        products={category.products}
                        selectedProductIds={selectedProducts.map(p => p.id)}
                        onProductSelect={handleProductSelect} 
                      />
                    )
                  }))}
                />

                {selectedProducts.length > 0 && (
                  <div style={{ marginTop: '24px' }}>
                    <div style={{ padding: '16px', backgroundColor: '#f0f9ff', borderRadius: '8px', border: '1px solid #3b82f6', marginBottom: '16px' }}>
                      <Title level={5} style={{ margin: 0, color: '#1f2937' }}>
                        Selected Products:
                      </Title>
                      <ul style={{ paddingLeft: '20px', margin: '8px 0 0' }}>
                        {selectedProducts.map(p => <li key={p.id}>{p.name}</li>)}
                      </ul>
                    </div>
                    <Button
                      type="primary"
                      size="large"
                      block
                      loading={submitting}
                      onClick={handleFinalSubmit}
                      style={{ height: '48px', fontSize: '16px', fontWeight: 'bold' }}
                    >
                      Complete Registration
                    </Button>
                  </div>
                )}
              </>
            )}
          </Col>

          {/* Right Panel - Product Details (Desktop) */}
          <Col xs={0} md={12} className="gradient-bg-banking" style={{ height: '100vh', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Card style={{ maxWidth: '500px', width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', border: 'none', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)' }}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <Title level={2} style={{ color: '#1f2937', marginBottom: '8px' }}>
                  {categories.find(c => c.id === selectedCategoryKey)?.name} Solutions
                </Title>
                <Paragraph style={{ fontSize: '16px', color: '#6b7280' }}>
                  Professional financial services designed to help your business thrive and grow.
                </Paragraph>
              </div>
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  )
}
