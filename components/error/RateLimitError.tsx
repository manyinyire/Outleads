'use client';

import React, { useState, useEffect } from 'react';
import ErrorPage from './ErrorPage';
import { Button, Progress } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';

interface RateLimitErrorProps {
  retryAfter?: number; // seconds
  message?: string;
}

const RateLimitError: React.FC<RateLimitErrorProps> = ({
  retryAfter = 60,
  message
}) => {
  const [countdown, setCountdown] = useState(retryAfter);
  const [canRetry, setCanRetry] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanRetry(true);
    }
  }, [countdown]);

  const handleRetry = () => {
    if (canRetry) {
      window.location.reload();
    }
  };

  const progressPercent = Math.max(0, ((retryAfter - countdown) / retryAfter) * 100);

  return (
    <ErrorPage
      statusCode={429}
      title="Too Many Requests"
      message={message || "You've made too many requests. Please wait before trying again."}
      showRetry={false}
      showHome={true}
      showBack={true}
      customActions={
        <div style={{ textAlign: 'center', minWidth: '200px' }}>
          {!canRetry ? (
            <>
              <Progress 
                percent={Math.round(progressPercent)} 
                size="small" 
                style={{ marginBottom: '1rem' }}
              />
              <Button 
                disabled 
                icon={<ClockCircleOutlined />}
              >
                Wait {countdown}s
              </Button>
            </>
          ) : (
            <Button 
              type="primary" 
              onClick={handleRetry}
            >
              Try Again
            </Button>
          )}
        </div>
      }
    />
  );
};

export default RateLimitError;