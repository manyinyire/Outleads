import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getCookie } from 'cookies-next';

const token = getCookie('token');

export const fetchDashboardData = createAsyncThunk('admin/fetchDashboardData', async () => {
  const headers = { Authorization: `Bearer ${token}` };
  const [leads, campaigns] = await Promise.all([
    fetch('/api/admin/leads', { headers }).then(res => res.json()),
    fetch('/api/admin/campaigns', { headers }).then(res => res.json()),
  ]);
  return { leads, campaigns };
});

const adminSlice = createSlice({
  name: 'admin',
  initialState: {
    leads: [],
    campaigns: [],
    loading: false,
    error: null,
  },
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
        state.error = action.error.message;
      });
  },
});

export default adminSlice.reducer;
