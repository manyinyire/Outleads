import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { logger } from '@/lib/utils/logging'

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

const initialState: LandingState = {
  products: [],
  businessSectors: [],
  selectedCategory: 'finance',
  selectedProducts: [],
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
      logger.error('Error saving landing state to localStorage', error as Error)
    }
  }
}

const landingSlice = createSlice({
  name: 'landing',
  initialState,
  reducers: {
    hydrateFromLocalStorage: (state) => {
      if (typeof window !== 'undefined') {
        try {
          const savedLanding = localStorage.getItem('nexus-landing')
          if (savedLanding) {
            const parsed = JSON.parse(savedLanding)
            // Validate the structure before using it
            if (parsed && typeof parsed === 'object') {
              state.selectedCategory = parsed.selectedCategory || 'finance'
              state.selectedProducts = Array.isArray(parsed.selectedProducts) ? parsed.selectedProducts : []
            }
          }
        } catch (error) {
          logger.error('Error loading landing state from localStorage, clearing corrupted data', error as Error)
          // Clear corrupted data
          localStorage.removeItem('nexus-landing')
        }
      }
    },
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

export const { hydrateFromLocalStorage, setProducts, setSectors, setSelectedCategory, setSelectedProducts, toggleProductSelection } = landingSlice.actions
export default landingSlice.reducer