'use client'

import { ConfigProvider } from 'antd'
import { Provider } from 'react-redux'
import { store } from '@/lib/store'
import { theme } from '@/lib/utils/theme'
import { HydrationProvider } from './hydration-provider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <ConfigProvider theme={theme}>
        <HydrationProvider>
          {children}
        </HydrationProvider>
      </ConfigProvider>
    </Provider>
  )
}