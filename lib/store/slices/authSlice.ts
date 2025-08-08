import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'

export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'user' | 'manager'
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
}

// Load initial state from localStorage if available
const loadInitialState = (): AuthState => {
  if (typeof window !== 'undefined') {
    try {
      const savedAuth = localStorage.getItem('nexus-auth')
      if (savedAuth) {
        const parsed = JSON.parse(savedAuth)
        return {
          user: parsed.user || null,
          isAuthenticated: parsed.isAuthenticated || false,
          loading: false,
          error: null,
        }
      }
    } catch (error) {
      console.error('Error loading auth from localStorage:', error)
    }
  }
  
  return {
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null,
  }
}

const initialState: AuthState = loadInitialState()

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Mock authentication - replace with real API
    if (credentials.email === 'admin@nexus.com' && credentials.password === 'admin123') {
      return {
        id: '1',
        email: 'admin@nexus.com',
        name: 'Admin User',
        role: 'admin' as const
      }
    } else if (credentials.email === 'user@nexus.com' && credentials.password === 'user123') {
      return {
        id: '2',
        email: 'user@nexus.com',
        name: 'Regular User',
        role: 'user' as const
      }
    } else {
      throw new Error('Invalid credentials')
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
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
        state.user = action.payload
        state.isAuthenticated = true
        
        // Save to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('nexus-auth', JSON.stringify({
            user: action.payload,
            isAuthenticated: true
          }))
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Login failed'
      })
  },
})

export const { logout, clearError } = authSlice.actions
export default authSlice.reducer
