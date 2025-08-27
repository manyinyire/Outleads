'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/store'
import AdminLayout from '@/components/admin/AdminLayout'

export default function AdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { isAuthenticated } = useSelector((state: RootState) => state.auth)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [mounted, isAuthenticated, router])

  if (!mounted || !isAuthenticated) {
    return null
  }

  return <AdminLayout>{children}</AdminLayout>
}
