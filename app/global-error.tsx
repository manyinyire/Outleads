'use client';

import { useEffect } from 'react';
import ErrorPage from '@/components/error/ErrorPage';
import { Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to monitoring service
    console.error('Global error occurred:', error);
  }, [error]);

  return (
    <html>
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>
        <ErrorPage
          statusCode={500}
          title="Application Error"
          message="A critical error occurred. Our team has been notified and is working on a fix."
          details={process.env.NODE_ENV === 'development' ? error.stack : undefined}
          showRetry={true}
          showHome={true}
          customActions={
            <Button 
              type="primary" 
              icon={<ReloadOutlined />} 
              onClick={reset}
            >
              Reset Application
            </Button>
          }
        />
      </body>
    </html>
  );
}
