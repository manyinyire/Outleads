'use client'

import { useSearchParams } from 'next/navigation'
import { ReactNode } from 'react'

interface SearchParamsWrapperProps {
  children: (searchParams: URLSearchParams) => ReactNode
}

function SearchParamsContent({ children }: SearchParamsWrapperProps) {
  const searchParams = useSearchParams()
  return <>{children(searchParams)}</>
}

export default function SearchParamsWrapper({ children }: SearchParamsWrapperProps) {
  return (
    <SearchParamsContent>
      {children}
    </SearchParamsContent>
  )
}
