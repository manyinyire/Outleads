import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'

export interface Campaign {
  id: string
  name: string
  companyName: string
  description: string
  url: string
  isActive: boolean
  createdAt: string
  leadCount: number
  conversionRate: number
}

export interface CampaignState {
  campaigns: Campaign[]
  loading: boolean
  error: string | null
  creating: boolean
}

const initialState: CampaignState = {
  campaigns: [],
  loading: false,
  error: null,
  creating: false,
}

export const createCampaign = createAsyncThunk(
  'campaign/createCampaign',
  async (campaignData: {
    name: string
    companyName: string
  }) => {
    const response = await fetch('/api/admin/campaigns', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(campaignData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to create campaign')
    }

    const data = await response.json()
    const campaign = data.campaign

    // Transform API response to match frontend interface
    return {
      id: campaign.id,
      name: campaign.name,
      companyName: campaign.companyName,
      description: '', // API doesn't have description field
      url: `${window.location.origin}/?campaign=${campaign.uniqueLink}`,
      isActive: true, // New campaigns are active by default
      createdAt: campaign.createdAt,
      leadCount: campaign._count?.leads || 0,
      conversionRate: 0, // Calculate this based on leads data if needed
    }
  }
)

export const fetchCampaigns = createAsyncThunk(
  'campaign/fetchCampaigns',
  async () => {
    const response = await fetch('/api/admin/campaigns', {
      method: 'GET',
      credentials: 'include',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to fetch campaigns')
    }

    const data = await response.json()
    const campaigns = data.campaigns || []

    // Transform API response to match frontend interface
    return campaigns.map((campaign: any) => ({
      id: campaign.id,
      name: campaign.name,
      companyName: campaign.companyName,
      description: '', // API doesn't have description field
      url: `${window.location.origin}/?campaign=${campaign.uniqueLink}`,
      isActive: true, // All campaigns are considered active for now
      createdAt: campaign.createdAt,
      leadCount: campaign._count?.leads || 0,
      conversionRate: 0, // Calculate this based on leads data if needed
    }))
  }
)

const campaignSlice = createSlice({
  name: 'campaign',
  initialState,
  reducers: {
    toggleCampaignStatus: (state, action: PayloadAction<string>) => {
      const campaign = state.campaigns.find(c => c.id === action.payload)
      if (campaign) {
        campaign.isActive = !campaign.isActive
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createCampaign.pending, (state) => {
        state.creating = true
        state.error = null
      })
      .addCase(createCampaign.fulfilled, (state, action) => {
        state.creating = false
        state.campaigns.unshift(action.payload)
      })
      .addCase(createCampaign.rejected, (state, action) => {
        state.creating = false
        state.error = action.error.message || 'Failed to create campaign'
      })
      .addCase(fetchCampaigns.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchCampaigns.fulfilled, (state, action) => {
        state.loading = false
        state.campaigns = action.payload
      })
      .addCase(fetchCampaigns.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch campaigns'
      })
  },
})

export const { toggleCampaignStatus } = campaignSlice.actions
export default campaignSlice.reducer
