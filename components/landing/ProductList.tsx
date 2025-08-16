'use client'

import { useState, useEffect } from 'react'
import { Checkbox, Skeleton } from 'antd'
import { useDispatch, useSelector } from 'react-redux'
import { RootState, AppDispatch } from '@/lib/store'
import { toggleProductSelection, setProducts } from '@/lib/store/slices/landingSlice'
import { Product } from '@/lib/store/slices/landingSlice'

export default function ProductList() {
  const dispatch = useDispatch<AppDispatch>()
  const { products, selectedProducts, selectedCategory } = useSelector((state: RootState) => state.landing)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`/api/products?category=${selectedCategory}`)
        const data = await response.json()
        dispatch(setProducts(data.products || []))
      } catch (error) {
        console.error('Failed to fetch products:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [dispatch, selectedCategory])

  const handleProductToggle = (productId: string) => {
    dispatch(toggleProductSelection(productId))
  }

  // Filter products by selected category
  const filteredProducts = products.filter(product => product.category === selectedCategory)

  if (loading) {
    return (
      <div>
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
            <Skeleton.Avatar active size="large" style={{ marginRight: '16px' }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <Skeleton.Input active style={{ width: '250px', marginBottom: '8px' }} />
              <Skeleton.Input active style={{ width: '200px' }} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderProduct = (product: Product) => {
    return (
      <div key={product.id} style={{ marginLeft: '24px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '12px',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            backgroundColor: selectedProducts.includes(product.id) ? '#e6f7ff' : 'transparent',
          }}
          onClick={() => handleProductToggle(product.id)}
        >
          <Checkbox
            checked={selectedProducts.includes(product.id)}
            onChange={() => handleProductToggle(product.id)}
            style={{ marginRight: '12px' }}
          />
          <div>
            <p style={{ fontWeight: 'semibold' }}>{product.name}</p>
            {product.description && <p style={{ fontSize: '14px', color: '#6b7280' }}>{product.description}</p>}
          </div>
        </div>
        {product.subProducts && product.subProducts.length > 0 && (
          <div style={{ marginLeft: '24px', borderLeft: '2px solid #e0e0e0' }}>
            {product.subProducts.map(renderProduct)}
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      {filteredProducts.map(renderProduct)}
    </div>
  )
}