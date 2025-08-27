'use client'

import { ConfigProvider, App } from 'antd'
import { Provider } from 'react-redux'
import { store } from '@/lib/store'
import { theme } from '@/lib/utils/theme'
import AuthProvider from '@/components/AuthProvider'
import QueryProvider from '@/components/QueryProvider'
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>
        <Provider store={store}>
          <QueryProvider>
            <AuthProvider>
              <ConfigProvider theme={theme}>
                <App>
                  {children}
                </App>
              </ConfigProvider>
            </AuthProvider>
          </QueryProvider>
        </Provider>
      </body>
    </html>
  )
}


