'use client';

import React from 'react';
import ErrorPage from './ErrorPage';
import { Button } from 'antd';
import { CustomerServiceOutlined, TeamOutlined } from '@ant-design/icons';

interface ForbiddenErrorProps {
  message?: string;
  requiredRole?: string;
  contactSupport?: boolean;
}

const ForbiddenError: React.FC<ForbiddenErrorProps> = ({
  message,
  requiredRole,
  contactSupport = true
}) => {
  const handleContactSupport = () => {
    window.location.href = 'mailto:support@outleads.com?subject=Access Request';
  };

  const defaultMessage = requiredRole 
    ? `This page requires ${requiredRole} role privileges to access.`
    : "You don't have permission to access this resource.";

  return (
    <ErrorPage
      statusCode={403}
      title="Access Denied"
      message={message || defaultMessage}
      showRetry={false}
      showHome={true}
      showBack={true}
      customActions={
        contactSupport && (
          <Button 
            icon={<CustomerServiceOutlined />} 
            onClick={handleContactSupport}
          >
            Contact Support
          </Button>
        )
      }
    />
  );
};

export default ForbiddenError;