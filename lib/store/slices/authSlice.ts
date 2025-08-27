import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'

// --- TYPE DEFINITIONS ---
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
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: string | null
}

// --- INITIAL STATE ---
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  status: 'idle', // 'idle' means we haven't started verifying yet
  error: null,
}

// --- ASYNC THUNKS ---

// Thunk for logging in
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { username: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      })
      
      const data = await response.json()
      if (!response.ok) {
        return rejectWithValue(data.message || 'Login failed')
      }
      
      localStorage.setItem('auth-token', data.token)
      return data.user
    } catch (error: any) {
      return rejectWithValue(error.message || 'An unknown error occurred')
    }
  }
)

// Thunk for verifying an existing token
export const verifyToken = createAsyncThunk(
  'auth/verifyToken',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('auth-token')
      if (!token) {
        return rejectWithValue('No token found')
      }

      const response = await fetch('/api/auth/verify', {
        headers: { 'Authorization': `Bearer ${token}` },
      })

      const data = await response.json()
      if (!response.ok) {
        localStorage.removeItem('auth-token')
        return rejectWithValue(data.message || 'Session expired')
      }
      
      return data.user
    } catch (error: any) {
      return rejectWithValue(error.message || 'Verification failed')
    }
  }
)

// --- SLICE DEFINITION ---
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null
      state.isAuthenticated = false
      state.status = 'idle'
      state.error = null
      localStorage.removeItem('auth-token')
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(login.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<User>) => {
        state.status = 'succeeded'
        state.user = action.payload
        state.isAuthenticated = true
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload as string
      })
      // Verify token cases
      .addCase(verifyToken.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(verifyToken.fulfilled, (state, action: PayloadAction<User>) => {
        state.status = 'succeeded'
        state.user = action.payload
        state.isAuthenticated = true
      })
      .addCase(verifyToken.rejected, (state, action) => {
        state.status = 'failed'
        state.isAuthenticated = false
        state.user = null
        state.error = action.payload as string
      })
  },
})

// Async logout function
export const logoutAsync = createAsyncThunk(
  'auth/logoutAsync',
  async (_, { dispatch }) => {
    dispatch(logout())
    return true
  }
)

// Check auth status function
export const checkAuthStatus = createAsyncThunk(
  'auth/checkAuthStatus',
  async (_, { dispatch }) => {
    return dispatch(verifyToken())
  }
)

export const { logout, clearError } = authSlice.actions
export default authSlice.reducer
