'use client'

import { ConfigProvider, App } from 'antd'
import { Provider } from 'react-redux'
import { store } from '@/lib/store'
import { theme } from '@/lib/theme'
import AuthProvider from '@/components/AuthProvider' // Import the new provider
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
          <AuthProvider> {/* Wrap the app with AuthProvider */}
            <ConfigProvider theme={theme}>
              <App>
                {children}
              </App>
            </ConfigProvider>
          </AuthProvider>
        </Provider>
      </body>
    </html>
  )
}


