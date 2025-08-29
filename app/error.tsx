'use client';

import { useEffect } from 'react';
import ErrorPage from '@/components/error/ErrorPage';
import { Button } from 'antd';
import { ReloadOutlined, BugOutlined } from '@ant-design/icons';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to your error reporting service
    console.error('Page error occurred:', error);
  }, [error]);

  return (
    <ErrorPage
      statusCode={500}
      title="Something Went Wrong"
      message="An error occurred while loading this page. Please try refreshing or contact support if the problem persists."
      details={process.env.NODE_ENV === 'development' ? error.stack : undefined}
      showRetry={false}
      showHome={true}
      showBack={true}
      customActions={
        <Button 
          type="primary" 
          icon={<ReloadOutlined />} 
          onClick={reset}
        >
          Try Again
        </Button>
      }
    />
  );
}