'use client';

import React from 'react';
import ErrorPage from './ErrorPage';
import { Button } from 'antd';
import { LoginOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

interface UnauthorizedErrorProps {
  message?: string;
  redirectPath?: string;
}

const UnauthorizedError: React.FC<UnauthorizedErrorProps> = ({
  message,
  redirectPath = '/auth/login'
}) => {
  const router = useRouter();

  const handleLogin = () => {
    router.push(redirectPath);
  };

  return (
    <ErrorPage
      statusCode={401}
      title="Authentication Required"
      message={message || "You need to sign in to access this page."}
      showRetry={false}
      showHome={true}
      showBack={true}
      customActions={
        <Button 
          type="primary" 
          icon={<LoginOutlined />} 
          onClick={handleLogin}
        >
          Sign In
        </Button>
      }
    />
  );
};

export default UnauthorizedError;