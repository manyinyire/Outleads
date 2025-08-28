'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { message } from 'antd'

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

export function useLeadForm(initialCategories: ProductCategory[]) {
  const searchParams = useSearchParams()
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([])
  const [contactFormData, setContactFormData] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string>('')

  useEffect(() => {
    if (initialCategories.length > 0 && !selectedCategoryKey) {
      setSelectedCategoryKey(initialCategories[0].id)
    }
  }, [initialCategories, selectedCategoryKey])

  useEffect(() => {
    const campaignIdFromUrl = searchParams.get('campaignId');
    if (campaignIdFromUrl) {
      localStorage.setItem('campaignId', campaignIdFromUrl);
      setCampaignId(campaignIdFromUrl);
    } else {
      const storedCampaignId = localStorage.getItem('campaignId');
      if (storedCampaignId) {
        setCampaignId(storedCampaignId);
      }
    }
  }, [searchParams]);

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

  return {
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
  }
}
