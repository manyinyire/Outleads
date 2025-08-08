import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'

export interface Product {
  id: string
  name: string
  description: string
  category: string
}

export interface BusinessSector {
  id: string
  name: string
}

export interface LandingState {
  products: Product[]
  businessSectors: BusinessSector[]
  selectedCategory: string
  selectedProducts: string[]
  loading: boolean
  error: string | null
}

// Load initial state from localStorage if available
const loadInitialState = (): Partial<LandingState> => {
  if (typeof window !== 'undefined') {
    try {
      const savedLanding = localStorage.getItem('nexus-landing')
      if (savedLanding) {
        const parsed = JSON.parse(savedLanding)
        return {
          selectedCategory: parsed.selectedCategory || 'finance',
          selectedProducts: parsed.selectedProducts || [],
        }
      }
    } catch (error) {
      console.error('Error loading landing state from localStorage:', error)
    }
  }
  
  return {
    selectedCategory: 'finance',
    selectedProducts: [],
  }
}

const savedState = loadInitialState()

const initialState: LandingState = {
  products: [],
  businessSectors: [],
  selectedCategory: savedState.selectedCategory || 'finance',
  selectedProducts: savedState.selectedProducts || [],
  loading: false,
  error: null,
}

// Mock API calls - replace with real API endpoints
export const fetchProducts = createAsyncThunk(
  'landing/fetchProducts',
  async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    return [
      { id: '1', name: 'Business Loans', description: 'Flexible financing solutions for your business growth', category: 'finance' },
      { id: '2', name: 'Equipment Finance', description: 'Finance your business equipment with competitive rates', category: 'finance' },
      { id: '3', name: 'Trade Finance', description: 'International trade financing solutions', category: 'finance' },
      { id: '4', name: 'Business Insurance', description: 'Comprehensive coverage for your business', category: 'insurance' },
      { id: '5', name: 'Professional Indemnity', description: 'Protection against professional liability claims', category: 'insurance' },
      { id: '6', name: 'Investment Advisory', description: 'Expert investment guidance and portfolio management', category: 'investment' },
      { id: '7', name: 'Wealth Management', description: 'Comprehensive wealth planning services', category: 'investment' },
      { id: '8', name: 'Corporate Banking', description: 'Full-service banking solutions for corporations', category: 'banking' },
      { id: '9', name: 'Cash Management', description: 'Optimize your cash flow and liquidity', category: 'banking' },
    ]
  }
)

export const fetchBusinessSectors = createAsyncThunk(
  'landing/fetchBusinessSectors',
  async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))
    return [
      { id: '1', name: 'Technology' },
      { id: '2', name: 'Healthcare' },
      { id: '3', name: 'Manufacturing' },
      { id: '4', name: 'Retail' },
      { id: '5', name: 'Construction' },
      { id: '6', name: 'Professional Services' },
      { id: '7', name: 'Hospitality' },
      { id: '8', name: 'Education' },
    ]
  }
)

// Helper function to save state to localStorage
const saveToLocalStorage = (state: LandingState) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('nexus-landing', JSON.stringify({
        selectedCategory: state.selectedCategory,
        selectedProducts: state.selectedProducts,
      }))
    } catch (error) {
      console.error('Error saving landing state to localStorage:', error)
    }
  }
}

const landingSlice = createSlice({
  name: 'landing',
  initialState,
  reducers: {
    setSelectedCategory: (state, action: PayloadAction<string>) => {
      state.selectedCategory = action.payload
      saveToLocalStorage(state)
    },
    setSelectedProducts: (state, action: PayloadAction<string[]>) => {
      state.selectedProducts = action.payload
      saveToLocalStorage(state)
    },
    toggleProductSelection: (state, action: PayloadAction<string>) => {
      const productId = action.payload
      if (state.selectedProducts.includes(productId)) {
        state.selectedProducts = state.selectedProducts.filter(id => id !== productId)
      } else {
        state.selectedProducts.push(productId)
      }
      saveToLocalStorage(state)
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false
        state.products = action.payload
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch products'
      })
      .addCase(fetchBusinessSectors.fulfilled, (state, action) => {
        state.businessSectors = action.payload
      })
  },
})

export const { setSelectedCategory, setSelectedProducts, toggleProductSelection } = landingSlice.actions
export default landingSlice.reducer
