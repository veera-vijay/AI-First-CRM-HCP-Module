import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';
import { addToast } from './notificationSlice';

export const fetchFollowUps = createAsyncThunk(
  'followup/fetchAll',
  async (status = null, { rejectWithValue }) => {
    try {
      let url = '/api/followups';
      if (status) {
        url += `?status=${status}`;
      }
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch follow-ups.');
    }
  }
);

export const createFollowUpRecord = createAsyncThunk(
  'followup/create',
  async (followupData, { rejectWithValue, dispatch }) => {
    try {
      const response = await api.post('/api/followup', followupData);
      dispatch(addToast({ message: 'Follow-up scheduled successfully!', type: 'success' }));
      return response.data;
    } catch (error) {
      const msg = error.response?.data?.detail || 'Failed to schedule follow-up.';
      dispatch(addToast({ message: msg, type: 'error' }));
      return rejectWithValue(msg);
    }
  }
);

export const toggleFollowUpStatus = createAsyncThunk(
  'followup/toggleStatus',
  async ({ id, status }, { rejectWithValue, dispatch }) => {
    try {
      await api.put(`/api/followup/${id}/status?status=${status}`);
      dispatch(addToast({ message: `Marked task as ${status}!`, type: 'success' }));
      return { id, status };
    } catch (error) {
      const msg = error.response?.data?.detail || 'Failed to update follow-up task status.';
      dispatch(addToast({ message: msg, type: 'error' }));
      return rejectWithValue(msg);
    }
  }
);

const followupSlice = createSlice({
  name: 'followup',
  initialState: {
    followups: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch all
      .addCase(fetchFollowUps.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFollowUps.fulfilled, (state, action) => {
        state.loading = false;
        state.followups = action.payload;
      })
      .addCase(fetchFollowUps.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create followup
      .addCase(createFollowUpRecord.pending, (state) => {
        state.loading = true;
      })
      .addCase(createFollowUpRecord.fulfilled, (state, action) => {
        state.loading = false;
        state.followups.push(action.payload);
      })
      .addCase(createFollowUpRecord.rejected, (state) => {
        state.loading = false;
      })
      // Toggle Status
      .addCase(toggleFollowUpStatus.fulfilled, (state, action) => {
        const item = state.followups.find(f => f.id === action.payload.id);
        if (item) {
          item.status = action.payload.status;
        }
      });
  }
});

export default followupSlice.reducer;
