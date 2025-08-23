'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Layout, Row, Col, Tabs, Typography, Button, Steps, message, Spin, Card } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import ProductList from '@/components/landing/ProductList'
import LeadForm from '@/components/landing/LeadForm'
import Image from 'next/image'

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
          campaignId: campaignId || undefined, // Use campaignId from the HomePage state
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
      
      // Clear the campaignId from storage after successful submission
      if (campaignId) {
        localStorage.removeItem('campaignId');
        setCampaignId(null);
      }

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
      <Layout style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0F0F0' }}>
        <Spin size="large" />
      </Layout>
    )
  }

  return (
    <Layout style={{ minHeight: '100vh', background: 'linear-gradient(to right, #2A4D74, #6ED0F6)' }}>
      <Content style={{ padding: '2rem' }}>
        <Row justify="center" align="middle" style={{ minHeight: '100%' }}>
          <Col xs={24} sm={20} md={16} lg={12} xl={10}>
            <Card style={{ borderRadius: '1rem', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', padding: '2rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <Image src="/logos/logo.png" alt="Nexus Financial Services" width={80} height={80} />
                <Title level={2} style={{ color: '#2A4D74', marginTop: '1rem', fontWeight: 'bold' }}>
                  Nexus Financial Services
                </Title>
                <Paragraph style={{ fontSize: '1rem', color: '#333333' }}>
                  Discover our comprehensive range of financial solutions tailored for your business needs.
                </Paragraph>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <Steps current={currentStep} items={steps} />
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
                  <Card bordered={false} style={{ backgroundColor: '#F0F0F0', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
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

                  <Tabs
                    activeKey={selectedCategoryKey}
                    onChange={handleCategoryChange}
                    items={categories.map(category => ({
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

                  {selectedProducts.length > 0 && (
                    <div style={{ marginTop: '2rem' }}>
                      <Card bordered={false} style={{ backgroundColor: '#F0F0F0', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
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