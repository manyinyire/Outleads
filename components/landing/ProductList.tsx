'use client'

import { useState, useEffect } from 'react'
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
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

  // Filter products by selected category
  const filteredProducts = products.filter(product => product.category === selectedCategory)

  if (loading) {
    return (
      <div>
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex items-center space-x-4 mb-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderProduct = (product: Product) => {
    return (
      <div key={product.id} className="ml-6">
        <div
          className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${selectedProducts.includes(product.id) ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
          onClick={() => handleProductToggle(product.id)}
        >
          <Checkbox
            checked={selectedProducts.includes(product.id)}
            onCheckedChange={() => handleProductToggle(product.id)}
          />
          <div>
            <p className="font-semibold">{product.name}</p>
            {product.description && <p className="text-sm text-gray-500">{product.description}</p>}
          </div>
        </div>
        {product.subProducts && product.subProducts.length > 0 && (
          <div className="ml-6 border-l-2 border-gray-200">
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