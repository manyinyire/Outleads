'use client';

import React from 'react';
import { Button, Result, Space, Typography } from 'antd';
import { HomeOutlined, ReloadOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const { Text, Paragraph } = Typography;

export interface ErrorPageProps {
  statusCode?: number;
  title?: string;
  message?: string;
  details?: string;
  showRetry?: boolean;
  showHome?: boolean;
  showBack?: boolean;
  customActions?: React.ReactNode;
}

const ErrorPage: React.FC<ErrorPageProps> = ({
  statusCode = 500,
  title,
  message,
  details,
  showRetry = true,
  showHome = true,
  showBack = false,
  customActions,
}) => {
  const router = useRouter();

  // Define error configurations based on status code
  const getErrorConfig = (code: number) => {
    switch (code) {
      case 400:
        return {
          status: 'warning' as const,
          title: title || 'Bad Request',
          message: message || 'The request could not be understood or was missing required parameters.',
          icon: '⚠️',
        };
      case 401:
        return {
          status: 'warning' as const,
          title: title || 'Authentication Required',
          message: message || 'You need to sign in to access this resource.',
          icon: '🔐',
        };
      case 403:
        return {
          status: 'warning' as const,
          title: title || 'Access Denied',
          message: message || 'You don\'t have permission to access this resource.',
          icon: '🚫',
        };
      case 404:
        return {
          status: 'warning' as const,
          title: title || 'Page Not Found',
          message: message || 'The page you\'re looking for doesn\'t exist or has been moved.',
          icon: '🔍',
        };
      case 429:
        return {
          status: 'warning' as const,
          title: title || 'Too Many Requests',
          message: message || 'You\'ve made too many requests. Please wait a moment and try again.',
          icon: '⏰',
        };
      case 500:
        return {
          status: 'error' as const,
          title: title || 'Internal Server Error',
          message: message || 'Something went wrong on our end. Our team has been notified.',
          icon: '🔧',
        };
      case 502:
        return {
          status: 'error' as const,
          title: title || 'Service Unavailable',
          message: message || 'The service is temporarily unavailable. Please try again later.',
          icon: '⛔',
        };
      case 503:
        return {
          status: 'error' as const,
          title: title || 'Service Unavailable',
          message: message || 'The service is currently under maintenance. Please try again later.',
          icon: '🛠️',
        };
      default:
        return {
          status: 'error' as const,
          title: title || 'Something Went Wrong',
          message: message || 'An unexpected error occurred. Please try again.',
          icon: '❌',
        };
    }
  };

  const config = getErrorConfig(statusCode);

  const handleRetry = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    router.push('/');
  };

  const handleGoBack = () => {
    router.back();
  };

  const actionButtons = [];

  if (showRetry) {
    actionButtons.push(
      <Button
        key="retry"
        type="primary"
        icon={<ReloadOutlined />}
        onClick={handleRetry}
      >
        Try Again
      </Button>
    );
  }

  if (showHome) {
    actionButtons.push(
      <Button
        key="home"
        icon={<HomeOutlined />}
        onClick={handleGoHome}
      >
        Go to Home
      </Button>
    );
  }

  if (showBack) {
    actionButtons.push(
      <Button
        key="back"
        icon={<ArrowLeftOutlined />}
        onClick={handleGoBack}
      >
        Go Back
      </Button>
    );
  }

  return (
    <div style={{ 
      minHeight: '60vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <Result
        status={config.status}
        title={
          <Space direction="vertical" size="small">
            <Text style={{ fontSize: '2rem' }}>{config.icon}</Text>
            <Text strong style={{ fontSize: '1.5rem' }}>
              {config.title}
            </Text>
          </Space>
        }
        subTitle={
          <Space direction="vertical" size="middle" style={{ maxWidth: '500px' }}>
            <Paragraph style={{ fontSize: '1rem', margin: 0 }}>
              {config.message}
            </Paragraph>
            {details && process.env.NODE_ENV === 'development' && (
              <details style={{ textAlign: 'left', marginTop: '1rem' }}>
                <summary style={{ cursor: 'pointer', color: '#666' }}>
                  Technical Details (Development Only)
                </summary>
                <pre style={{ 
                  background: '#f5f5f5', 
                  padding: '1rem', 
                  borderRadius: '4px',
                  fontSize: '0.85rem',
                  overflow: 'auto',
                  marginTop: '0.5rem'
                }}>
                  {details}
                </pre>
              </details>
            )}
          </Space>
        }
        extra={
          <Space size="middle">
            {actionButtons}
            {customActions}
          </Space>
        }
      />
    </div>
  );
};

export default ErrorPage;