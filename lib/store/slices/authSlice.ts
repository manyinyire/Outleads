import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'

export interface User {
  id: string
  email: string
  username: string
  name: string
  role: 'ADMIN' | 'BSS' | 'INFOSEC' | 'AGENT' | 'SUPERVISOR'
  status: 'PENDING' | 'ACTIVE' | 'INACTIVE'
  sbu?: string
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
}

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { username: string; password: string }) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
      credentials: 'include', // Include cookies
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Login failed')
    }
    
    const data = await response.json()
    return data
  }
)

export const checkAuthStatus = createAsyncThunk(
  'auth/checkStatus',
  async () => {
    const response = await fetch('/api/auth/me', {
      credentials: 'include', // Include cookies
    })
    
    if (!response.ok) {
      throw new Error('Not authenticated')
    }
    
    const data = await response.json()
    return data
  }
)

export const logoutAsync = createAsyncThunk(
  'auth/logout',
  async () => {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include', // Include cookies
    })
    
    if (!response.ok) {
      throw new Error('Logout failed')
    }
    
    return await response.json()
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    hydrateFromLocalStorage: (state) => {
      if (typeof window !== 'undefined') {
        try {
          const savedAuth = localStorage.getItem('nexus-auth')
          if (savedAuth) {
            const parsed = JSON.parse(savedAuth)
            // Validate the structure before using it
            if (parsed && typeof parsed === 'object' && parsed.user) {
              state.user = parsed.user
              state.isAuthenticated = parsed.isAuthenticated || false
            }
          }
        } catch (error) {
          console.error('Error loading auth from localStorage, clearing corrupted data:', error)
          // Clear corrupted data
          localStorage.removeItem('nexus-auth')
        }
      }
    },
    logout: (state) => {
      state.user = null
      state.isAuthenticated = false
      state.error = null
      
      // Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('nexus-auth')
      }
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.isAuthenticated = true
        
        // Save to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('nexus-auth', JSON.stringify({
            user: action.payload.user,
            isAuthenticated: true
          }))
        }
      })
      .addCase(login.rejected, (state, action) => {
        console.error('Login rejected:', action.error);
        state.loading = false
        state.error = action.error.message || 'Login failed'
      })
      .addCase(checkAuthStatus.pending, (state) => {
        state.loading = true
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.isAuthenticated = true
        
        // Save to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('nexus-auth', JSON.stringify({
            user: action.payload.user,
            isAuthenticated: true
          }))
        }
      })
      .addCase(checkAuthStatus.rejected, (state) => {
        state.loading = false
        state.user = null
        state.isAuthenticated = false
        
        // Clear localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('nexus-auth')
        }
      })
      .addCase(logoutAsync.fulfilled, (state) => {
        state.user = null
        state.isAuthenticated = false
        state.error = null
        
        // Clear localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('nexus-auth')
        }
      })
  },
})

export const { hydrateFromLocalStorage, logout, clearError } = authSlice.actions
export default authSlice.reducer
