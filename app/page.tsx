import { Suspense } from 'react'
import { Layout, Spin } from 'antd'
import { HomePageContent } from '@/components/landing/HomePageContent'
import { prisma } from '@/lib/db/prisma'

async function getProductCategories() {
  try {
    const productCategories = await prisma.productCategory.findMany({
      include: {
        products: true,
      },
    });
    // Ensure the data is a plain object for serialization
    return JSON.parse(JSON.stringify(productCategories));
  } catch (error) {
    console.error("Failed to fetch product categories:", error);
    return [];
  }
}

export default async function HomePage() {
  const categories = await getProductCategories();

  return (
    <Suspense fallback={
      <Layout style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0F0F0' }}>
        <Spin size="large" />
      </Layout>
    }>
      <HomePageContent initialCategories={categories} />
    </Suspense>
  )
}