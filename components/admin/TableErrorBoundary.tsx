'use client'

import { Result, Button } from 'antd'
import { ReloadOutlined, HomeOutlined } from '@ant-design/icons'
import ErrorBoundary from './ErrorBoundary'

interface TableErrorBoundaryProps {
  readonly children: React.ReactNode
  readonly entityName?: string
}

export default function TableErrorBoundary({ children, entityName = 'data' }: TableErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={
        <Result
          status="warning"
          title={`Error loading ${entityName}`}
          subTitle={`There was a problem loading the ${entityName}. This might be a temporary issue.`}
          extra={[
            <Button 
              type="primary" 
              key="reload"
              icon={<ReloadOutlined />}
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </Button>,
            <Button 
              key="home"
              icon={<HomeOutlined />}
              onClick={() => window.location.href = '/admin'}
            >
              Go to Dashboard
            </Button>
          ]}
        />
      }
      onError={(error, errorInfo) => {
        // Log to monitoring service in production
        console.error(`Table Error for ${entityName}:`, error, errorInfo)
      }}
    >
      {children}
    </ErrorBoundary>
  )
}
