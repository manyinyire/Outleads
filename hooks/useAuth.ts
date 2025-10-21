import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';

export const useAuth = () => {
  const { user, isAuthenticated, status } = useSelector((state: RootState) => state.auth);

  return {
    user,
    isAuthenticated,
    isLoading: status === 'loading',
    isSuccess: status === 'succeeded',
    isError: status === 'failed',
  };
};
