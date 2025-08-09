import { createSlice, PayloadAction } from '@reduxjs/toolkit'

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
    setProducts: (state, action: PayloadAction<Product[]>) => {
      state.products = action.payload;
    },
    setSectors: (state, action: PayloadAction<BusinessSector[]>) => {
      state.businessSectors = action.payload;
    },
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
})

export const { setProducts, setSectors, setSelectedCategory, setSelectedProducts, toggleProductSelection } = landingSlice.actions
export default landingSlice.reducer