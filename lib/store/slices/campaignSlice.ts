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
    description: string
  }) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const campaignId = `camp_${Date.now()}`
    const newCampaign: Campaign = {
      id: campaignId,
      ...campaignData,
      url: `${window.location.origin}/?campaign=${campaignId}`,
      isActive: true,
      createdAt: new Date().toISOString(),
      leadCount: 0,
      conversionRate: 0,
    }
    
    return newCampaign
  }
)

export const fetchCampaigns = createAsyncThunk(
  'campaign/fetchCampaigns',
  async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Mock data
    return [
      {
        id: 'camp_1',
        name: 'TechCorp Campaign',
        companyName: 'TechCorp Solutions',
        description: 'Lead generation campaign for technology sector',
        url: `${window.location.origin}/?campaign=camp_1`,
        isActive: true,
        createdAt: '2024-01-10T09:00:00Z',
        leadCount: 15,
        conversionRate: 12.5,
      },
      {
        id: 'camp_2',
        name: 'HealthPlus Campaign',
        companyName: 'HealthPlus Medical',
        description: 'Healthcare sector financial services campaign',
        url: `${window.location.origin}/?campaign=camp_2`,
        isActive: true,
        createdAt: '2024-01-08T11:30:00Z',
        leadCount: 8,
        conversionRate: 25.0,
      },
    ]
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
