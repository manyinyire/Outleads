import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getCookie } from 'cookies-next';

const token = getCookie('token');

export const fetchDashboardData = createAsyncThunk('admin/fetchDashboardData', async () => {
  const headers = { Authorization: `Bearer ${token}` };
  const [leadsResponse, campaignsResponse] = await Promise.all([
    fetch('/api/admin/leads', { headers }).then(res => res.json()),
    fetch('/api/admin/campaigns', { headers }).then(res => res.json()),
  ]);
  
  // Handle different API response formats
  const leads = Array.isArray(leadsResponse) ? leadsResponse : [];
  const campaigns = Array.isArray(campaignsResponse?.campaigns) ? campaignsResponse.campaigns : 
                   Array.isArray(campaignsResponse) ? campaignsResponse : [];
  
  return { leads, campaigns };
});

interface AdminState {
  leads: any[];
  campaigns: any[];
  loading: boolean;
  error: string | null;
}

const initialState: AdminState = {
  leads: [],
  campaigns: [],
  loading: false,
  error: null,
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.loading = false;
        state.leads = action.payload.leads;
        state.campaigns = action.payload.campaigns;
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch dashboard data';
      });
  },
});

export default adminSlice.reducer;
