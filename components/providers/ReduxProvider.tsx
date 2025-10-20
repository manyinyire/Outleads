'use client';

import { Provider } from 'react-redux';
import { store } from '@/lib/store';
import { App as AntdApp } from 'antd';

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AntdApp>
        {children}
      </AntdApp>
    </Provider>
  );
}
