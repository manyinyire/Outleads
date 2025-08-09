import { configureStore } from '@reduxjs/toolkit'
import { combineReducers } from '@reduxjs/toolkit'

import landingSlice from './slices/landingSlice'
import authSlice from './slices/authSlice'
import leadSlice from './slices/leadSlice'
import campaignSlice from './slices/campaignSlice'
import adminSlice from './slices/adminSlice'

const rootReducer = combineReducers({
  landing: landingSlice,
  auth: authSlice,
  lead: leadSlice,
  campaign: campaignSlice,
  admin: adminSlice,
})

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
