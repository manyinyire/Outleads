import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'

export interface Lead {
  id: string
  fullName: string
  phoneNumber: string
  businessSector: string
  interestedProducts: string[]
  campaignId?: string
  campaignName?: string
  createdAt: string
  status: 'new' | 'contacted' | 'qualified' | 'converted'
}

export interface LeadState {
  leads: Lead[]
  loading: boolean
  error: string | null
  submitting: boolean
}

const initialState: LeadState = {
  leads: [],
  loading: false,
  error: null,
  submitting: false,
}

export const submitLead = createAsyncThunk(
  'lead/submitLead',
  async (leadData: {
    fullName: string
    phoneNumber: string
    businessSector: string
    interestedProducts: { id: string }[]
    campaignId?: string
  }) => {
    const response = await fetch(`/api/leads?campaignId=${leadData.campaignId || ''}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: leadData.fullName,
          email: 'email@example.com', // TODO: Add email to form
          phone: leadData.phoneNumber,
          products: leadData.interestedProducts,
        }),
      }
    );
    const data = await response.json();
    return data;
  }
)

export const fetchLeads = createAsyncThunk(
  'lead/fetchLeads',
  async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Mock data
    return [
      {
        id: '1',
        fullName: 'John Smith',
        phoneNumber: '+1234567890',
        businessSector: 'Technology',
        interestedProducts: ['Business Loans', 'Equipment Finance'],
        campaignId: 'camp_1',
        campaignName: 'TechCorp Campaign',
        createdAt: '2024-01-15T10:30:00Z',
        status: 'new' as const,
      },
      {
        id: '2',
        fullName: 'Sarah Johnson',
        phoneNumber: '+1234567891',
        businessSector: 'Healthcare',
        interestedProducts: ['Business Insurance', 'Professional Indemnity'],
        campaignId: 'camp_2',
        campaignName: 'HealthPlus Campaign',
        createdAt: '2024-01-14T14:20:00Z',
        status: 'contacted' as const,
      },
    ]
  }
)

const leadSlice = createSlice({
  name: 'lead',
  initialState,
  reducers: {
    updateLeadStatus: (state, action: PayloadAction<{ id: string; status: Lead['status'] }>) => {
      const lead = state.leads.find(l => l.id === action.payload.id)
      if (lead) {
        lead.status = action.payload.status
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitLead.pending, (state) => {
        state.submitting = true
        state.error = null
      })
      .addCase(submitLead.fulfilled, (state, action) => {
        state.submitting = false
        state.leads.unshift(action.payload)
      })
      .addCase(submitLead.rejected, (state, action) => {
        state.submitting = false
        state.error = action.error.message || 'Failed to submit lead'
      })
      .addCase(fetchLeads.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchLeads.fulfilled, (state, action) => {
        state.loading = false
        state.leads = action.payload
      })
      .addCase(fetchLeads.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch leads'
      })
  },
})

export const { updateLeadStatus } = leadSlice.actions
export default leadSlice.reducer
