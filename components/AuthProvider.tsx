'use client'

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/lib/store';
import { verifyToken } from '@/lib/store/slices/authSlice';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    // On initial load, try to verify the token from localStorage
    const token = localStorage.getItem('auth-token');
    if (token) {
      dispatch(verifyToken());
    }
  }, [dispatch]);

  return <>{children}</>;
}
