import type { ThemeConfig } from 'antd';

export const theme: ThemeConfig = {
  token: {
    colorPrimary: '#1890ff',
    borderRadius: 6,
    colorBgContainer: '#ffffff',
  },
  components: {
    Button: {
      controlHeight: 36,
      fontSize: 14,
    },
    Input: {
      controlHeight: 36,
      fontSize: 14,
    },
    Select: {
      controlHeight: 36,
      fontSize: 14,
    },
  },
};
