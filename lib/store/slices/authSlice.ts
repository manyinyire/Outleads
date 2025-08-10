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
  async (credentials: { username: string; password: string }) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Login failed')
    }
    
    const data = await response.json()
    return data
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
  },
})

export const { logout, clearError } = authSlice.actions
export default authSlice.reducer
