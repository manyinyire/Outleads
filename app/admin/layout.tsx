'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '@/lib/store'
import { verifyToken } from '@/lib/store/slices/authSlice'
import AdminLayout from '@/components/admin/AdminLayout'

export default function AdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const { isAuthenticated, status } = useSelector((state: RootState) => state.auth)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth-token')
      if (token) {
        // Try to verify the token
        await dispatch(verifyToken())
      }
      setIsChecking(false)
    }
    
    checkAuth()
  }, [dispatch])

  useEffect(() => {
    // Only redirect after we've finished checking
    if (!isChecking && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isChecking, isAuthenticated, router])

  // Show loading while checking authentication
  if (isChecking || status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <AdminLayout>{children}</AdminLayout>
}
