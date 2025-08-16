import { Providers } from '@/components/providers'
import './globals.css'
import AntdRegistry from '@/components/AntdRegistry'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <AntdRegistry>{children}</AntdRegistry>
        </Providers>
      </body>
    </html>
  )
}


