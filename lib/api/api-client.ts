import { clearAuth } from '../auth/clear-auth';

class ApiClient {
  private isRefreshing = false;
  private failedQueue: { resolve: (value?: any) => void; reject: (reason?: any) => void }[] = [];

  private processQueue = (error: any, token = null) => {
    this.failedQueue.forEach(prom => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve(token);
      }
    });

    this.failedQueue = [];
  };

  private getHeaders() {
    const token = localStorage.getItem('auth-token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  private async refreshToken() {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const { token } = await response.json();
      localStorage.setItem('auth-token', token);
      return token;
    } catch (error) {
      clearAuth();
      return Promise.reject(error);
    }
  }

  private async handleResponse<T>(response: Response, url: string, options: RequestInit): Promise<T> {
    if (response.status === 401 || response.status === 403) {
      if (!this.isRefreshing) {
        this.isRefreshing = true;
        this.refreshToken()
          .then(token => {
            this.isRefreshing = false;
            this.processQueue(null, token);
          })
          .catch(error => {
            this.processQueue(error, null);
            clearAuth();
            window.location.href = '/auth/login';
          });
      }

      return new Promise((resolve, reject) => {
        this.failedQueue.push({ resolve, reject });
      }).then(() => {
        return this.request<T>(url, {
          ...options,
          headers: this.getHeaders(),
        });
      });
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API request failed');
    }
    const data = await response.json();
    // Some endpoints return data directly, others nest it in a `data` property.
    return data.data !== undefined ? data.data as T : data as T;
  }

  private async request<T>(url: string, options: RequestInit): Promise<T> {
    const response = await fetch(url, options);
    return this.handleResponse<T>(response, url, options);
  }

  async get<T>(url: string, params?: Record<string, any>): Promise<T> {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request<T>(`/api${url}${queryString}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
  }

  async post<T>(url: string, data: any): Promise<T> {
    return this.request<T>(`/api${url}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
  }

  async put<T>(url: string, data: any): Promise<T> {
    return this.request<T>(`/api${url}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
  }

  async delete<T>(url: string): Promise<T> {
    return this.request<T>(`/api${url}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
  }
}

export const apiClient = new ApiClient();
