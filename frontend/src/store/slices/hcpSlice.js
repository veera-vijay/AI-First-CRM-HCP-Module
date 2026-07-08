import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';
import { addToast } from './notificationSlice';

export const fetchHcps = createAsyncThunk(
  'hcp/fetchAll',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const { name, specialization, hospital, status } = filters;
      let query = '';
      const params = new URLSearchParams();
      if (name) params.append('name', name);
      if (specialization) params.append('specialization', specialization);
      if (hospital) params.append('hospital', hospital);
      if (status) params.append('status', status);
      
      const queryString = params.toString();
      const url = queryString ? `/api/hcps?${queryString}` : '/api/hcps';
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch HCPs.');
    }
  }
);

export const fetchHcpById = createAsyncThunk(
  'hcp/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/hcp/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to load HCP profile.');
    }
  }
);

export const createHcpProfile = createAsyncThunk(
  'hcp/create',
  async (hcpData, { rejectWithValue, dispatch }) => {
    try {
      const response = await api.post('/api/hcp', hcpData);
      dispatch(addToast({ message: 'HCP Profile created successfully!', type: 'success' }));
      return response.data;
    } catch (error) {
      const msg = error.response?.data?.detail || 'Failed to create HCP profile.';
      dispatch(addToast({ message: msg, type: 'error' }));
      return rejectWithValue(msg);
    }
  }
);

const hcpSlice = createSlice({
  name: 'hcp',
  initialState: {
    hcps: [],
    currentHcp: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearCurrentHcp: (state) => {
      state.currentHcp = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch all
      .addCase(fetchHcps.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHcps.fulfilled, (state, action) => {
        state.loading = false;
        state.hcps = action.payload;
      })
      .addCase(fetchHcps.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch by ID
      .addCase(fetchHcpById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHcpById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentHcp = action.payload;
      })
      .addCase(fetchHcpById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create HCP
      .addCase(createHcpProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(createHcpProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.hcps.push(action.payload);
      })
      .addCase(createHcpProfile.rejected, (state) => {
        state.loading = false;
      });
  }
});

export const { clearCurrentHcp } = hcpSlice.actions;
export default hcpSlice.reducer;
