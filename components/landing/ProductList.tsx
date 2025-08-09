'use client'

import { List, Checkbox, Skeleton, Typography } from 'antd'
import { useDispatch, useSelector } from 'react-redux'
import { RootState, AppDispatch } from '@/lib/store'
import { toggleProductSelection, setProducts } from '@/lib/store/slices/landingSlice'
import { Product } from '@/lib/store/slices/landingSlice'
import { useEffect, useState } from 'react'

const { Text } = Typography

export default function ProductList() {
  const dispatch = useDispatch<AppDispatch>()
  const { products, selectedProducts } = useSelector((state: RootState) => state.landing)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products')
        const data = await response.json()
        dispatch(setProducts(data.products || []))
      } catch (error) {
        console.error('Failed to fetch products:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [dispatch])

  const handleProductToggle = (productId: string) => {
    dispatch(toggleProductSelection(productId))
  }

  if (loading) {
    return (
      <List
        dataSource={Array.from({ length: 4 }, (_, index) => ({ key: index }))}
        rowKey="key"
        renderItem={() => (
          <List.Item>
            <Skeleton active paragraph={{ rows: 2 }} />
          </List.Item>
        )}
      />
    )
  }

  return (
    <List
      dataSource={products}
      rowKey="id"
      renderItem={(product) => (
        <List.Item
          style={{
            padding: '16px',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            marginBottom: '12px',
            backgroundColor: selectedProducts.includes(product.id) ? '#f0f9ff' : '#fff',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onClick={() => handleProductToggle(product.id)}
        >
          <List.Item.Meta
            avatar={
              <Checkbox
                checked={selectedProducts.includes(product.id)}
                onChange={() => handleProductToggle(product.id)}
              />
            }
            title={
              <Text strong style={{ color: '#1f2937' }}>
                {product.name}
              </Text>
            }
            description={
              <Text style={{ color: '#6b7280' }}>
                {product.description}
              </Text>
            }
          />
        </List.Item>
      )}
    />
  )
}
