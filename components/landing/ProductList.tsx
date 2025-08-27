'use client'

import { List, Checkbox, Typography } from 'antd'

const { Text } = Typography

// --- TYPE DEFINITIONS ---
interface Product {
  id: string;
  name: string;
  description?: string;
}

interface ProductListProps {
  readonly products: Product[];
  readonly selectedProductIds: string[];
  readonly onProductSelect: (product: Product) => void;
}

// --- COMPONENT ---
export default function ProductList({ products, selectedProductIds, onProductSelect }: ProductListProps) {
  return (
    <List
      dataSource={products}
      rowKey="id"
      renderItem={(product) => (
        <List.Item
          style={{
            padding: '12px',
            border: `1px solid ${selectedProductIds.includes(product.id) ? '#3b82f6' : '#e5e7eb'}`,
            backgroundColor: selectedProductIds.includes(product.id) ? '#f0f9ff' : '#fff',
            borderRadius: '8px',
            marginBottom: '8px',
            cursor: 'pointer',
          }}
          onClick={() => onProductSelect(product)}
        >
          <List.Item.Meta
            avatar={
              <Checkbox 
                checked={selectedProductIds.includes(product.id)} 
              />
            }
            title={<Text strong>{product.name}</Text>}
            description={product.description && <Text type="secondary">{product.description}</Text>}
          />
        </List.Item>
      )}
    />
  )
}
