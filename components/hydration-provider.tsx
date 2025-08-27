'use client'

import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { AppDispatch } from '@/lib/store'
import { checkAuthStatus } from '@/lib/store/slices/authSlice'
import { hydrateFromLocalStorage as hydrateLanding } from '@/lib/store/slices/landingSlice'

export function HydrationProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch<AppDispatch>()

  useEffect(() => {
    // Hydrate landing data from localStorage
    dispatch(hydrateLanding())
    
    // Check actual auth status from server (this will also hydrate auth state)
    dispatch(checkAuthStatus())
  }, [dispatch])

  return <>{children}</>
}