'use client'

import { ConfigProvider } from 'antd'
import { Provider } from 'react-redux'
import { store } from '@/lib/store'
import { theme } from '@/lib/theme'
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Provider store={store}>
          <ConfigProvider theme={theme}>
            {children}
          </ConfigProvider>
        </Provider>
      </body>
    </html>
  )
}


