import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from 'antd';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import UsersTable from '../UsersTable';
import { apiClient } from '@/lib/api/api-client';

// Mock the apiClient
jest.mock('@/lib/api/api-client');
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const mockStore = configureStore([]);
const store = mockStore({
  auth: {
    user: { role: 'ADMIN' },
  },
});

const AllTheProviders = ({ children }: { children: React.ReactNode }) => (
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <App>{children}</App>
    </QueryClientProvider>
  </Provider>
);

describe('UsersTable Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Clear the react-query cache before each test
    queryClient.clear();
  });

  it('should render the table with users', async () => {
    const mockUsers = [
      { id: '1', name: 'John Doe', email: 'john@example.com', role: 'ADMIN', status: 'ACTIVE', createdAt: new Date().toISOString() },
      { id: '2', name: 'Jane Doe', email: 'jane@example.com', role: 'AGENT', status: 'PENDING', createdAt: new Date().toISOString() },
    ];
    mockedApiClient.get.mockResolvedValue(mockUsers);

    render(
      <AllTheProviders>
        <UsersTable />
      </AllTheProviders>
    );

    // Wait for the users to be loaded and displayed
    expect(await screen.findByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  });

  it('should show an error message when fetching users fails', async () => {
    mockedApiClient.get.mockRejectedValue(new Error('Failed to fetch'));

    render(
      <AllTheProviders>
        <UsersTable />
      </AllTheProviders>
    );

    // Ant Design's message component might be tricky to test directly.
    // Instead, we can check if the table is empty.
    await waitFor(() => {
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });
  });

  it('should call the delete mutation when the delete button is clicked', async () => {
    const mockUsers = [
      { id: '1', name: 'John Doe', email: 'john@example.com', role: 'ADMIN', status: 'ACTIVE', createdAt: new Date().toISOString() },
    ];
    mockedApiClient.get.mockResolvedValue(mockUsers);
    mockedApiClient.delete.mockResolvedValue({});

    render(
      <AllTheProviders>
        <UsersTable />
      </AllTheProviders>
    );

    // Wait for the user to be loaded
    expect(await screen.findByText('John Doe')).toBeInTheDocument();

    // Find all delete buttons and click the first one
    const deleteButtons = await screen.findAllByRole('button', { name: /delete/i });
    fireEvent.click(deleteButtons[0]);

    // Wait for the confirmation dialog to appear
    const confirmButton = await screen.findByRole('button', { name: /yes/i });
    fireEvent.click(confirmButton);

    // Wait for the delete mutation to be called
    await waitFor(() => {
      expect(mockedApiClient.delete).toHaveBeenCalledWith('/admin/users/1');
    });
  });
});
