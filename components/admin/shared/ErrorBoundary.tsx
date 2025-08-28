'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Result, Button, Typography } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'

const { Paragraph, Text } = Typography

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return <>{this.props.fallback}</>
      }

      // Default error UI
      return (
        <Result
          status="error"
          title="Something went wrong"
          subTitle="An unexpected error occurred. Please try refreshing the page or contact support if the problem persists."
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
              key="retry"
              onClick={this.handleReset}
            >
              Try Again
            </Button>
          ]}
        >
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <div className="desc">
              <Paragraph>
                <Text
                  strong
                  style={{
                    fontSize: 16,
                  }}
                >
                  Error details (Development Only):
                </Text>
              </Paragraph>
              <Paragraph>
                <Text code>{this.state.error.toString()}</Text>
              </Paragraph>
              {this.state.errorInfo && (
                <Paragraph>
                  <Text code style={{ whiteSpace: 'pre-wrap' }}>
                    {this.state.errorInfo.componentStack}
                  </Text>
                </Paragraph>
              )}
            </div>
          )}
        </Result>
      )
    }

    return this.props.children
  }
}
