'use client';

import React from 'react';
import { Result, Button, Space, Alert } from 'antd';
import { ReloadOutlined, BugOutlined, CustomerServiceOutlined } from '@ant-design/icons';
import ErrorBoundary from '../ErrorBoundary';

interface AdminErrorBoundaryProps {
  children: React.ReactNode;
  title?: string;
  showTechnicalDetails?: boolean;
}

export default function AdminErrorBoundary({ 
  children, 
  title = "Admin Panel Error",
  showTechnicalDetails = true 
}: AdminErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={({ error, resetError }, errorInfo) => (
        <div style={{ padding: '2rem', minHeight: '400px' }}>
          <Result
            status="error"
            title={title}
            subTitle="An error occurred in the admin panel. This incident has been logged."
            extra={
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Space>
                  <Button 
                    type="primary" 
                    icon={<ReloadOutlined />} 
                    onClick={() => window.location.reload()}
                  >
                    Reload Page
                  </Button>
                  <Button 
                    icon={<CustomerServiceOutlined />}
                    onClick={() => window.location.href = 'mailto:admin@outleads.com?subject=Admin Panel Error'}
                  >
                    Report Issue
                  </Button>
                </Space>
                
                {showTechnicalDetails && process.env.NODE_ENV === 'development' && (
                  <Alert
                    message="Technical Details (Development Only)"
                    description={
                      <details>
                        <summary style={{ cursor: 'pointer', marginBottom: '1rem' }}>
                          Error Information
                        </summary>
                        <div style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '4px' }}>
                          <strong>Error:</strong>
                          <pre style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
                            {error.message}
                          </pre>
                          <strong>Stack Trace:</strong>
                          <pre style={{ fontSize: '0.75rem', maxHeight: '200px', overflow: 'auto' }}>
                            {error.stack}
                          </pre>
                          {errorInfo.componentStack && (
                            <>
                              <strong>Component Stack:</strong>
                              <pre style={{ fontSize: '0.75rem', maxHeight: '150px', overflow: 'auto' }}>
                                {errorInfo.componentStack}
                              </pre>
                            </>
                          )}
                        </div>
                      </details>
                    }
                    type="warning"
                    showIcon
                  />
                )}
              </Space>
            }
          />
        </div>
      )}
      onError={(error, errorInfo) => {
        // Log to monitoring service in production
        console.error('Admin panel error:', error, errorInfo);
        
        // In production, you might want to send this to your error tracking service
        if (process.env.NODE_ENV === 'production') {
          // Example: Send to error tracking service
          // errorTrackingService.captureException(error, { extra: errorInfo });
        }
      }}
    >
      {children}
    </ErrorBoundary>
  );
}