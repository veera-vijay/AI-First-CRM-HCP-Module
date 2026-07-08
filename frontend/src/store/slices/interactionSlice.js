import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';
import { addToast } from './notificationSlice';

export const fetchInteractions = createAsyncThunk(
  'interaction/fetchAll',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const { hcp_id } = filters;
      let url = '/api/interactions';
      if (hcp_id) {
        url += `?hcp_id=${hcp_id}`;
      }
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch interactions.');
    }
  }
);

export const createInteractionRecord = createAsyncThunk(
  'interaction/create',
  async (interactionData, { rejectWithValue, dispatch }) => {
    try {
      const response = await api.post('/api/interaction', interactionData);
      dispatch(addToast({ message: 'Interaction logged successfully!', type: 'success' }));
      return response.data;
    } catch (error) {
      const msg = error.response?.data?.detail || 'Failed to log interaction.';
      dispatch(addToast({ message: msg, type: 'error' }));
      return rejectWithValue(msg);
    }
  }
);

export const updateInteractionRecord = createAsyncThunk(
  'interaction/update',
  async ({ id, data }, { rejectWithValue, dispatch }) => {
    try {
      const response = await api.put(`/api/interaction/${id}`, data);
      dispatch(addToast({ message: 'Interaction updated successfully!', type: 'success' }));
      return response.data;
    } catch (error) {
      const msg = error.response?.data?.detail || 'Failed to update interaction.';
      dispatch(addToast({ message: msg, type: 'error' }));
      return rejectWithValue(msg);
    }
  }
);

export const deleteInteractionRecord = createAsyncThunk(
  'interaction/delete',
  async (id, { rejectWithValue, dispatch }) => {
    try {
      await api.delete(`/api/interaction/${id}`);
      dispatch(addToast({ message: 'Interaction log deleted.', type: 'success' }));
      return id;
    } catch (error) {
      const msg = error.response?.data?.detail || 'Failed to delete interaction.';
      dispatch(addToast({ message: msg, type: 'error' }));
      return rejectWithValue(msg);
    }
  }
);

const interactionSlice = createSlice({
  name: 'interaction',
  initialState: {
    interactions: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch all
      .addCase(fetchInteractions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInteractions.fulfilled, (state, action) => {
        state.loading = false;
        state.interactions = action.payload;
      })
      .addCase(fetchInteractions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create interaction
      .addCase(createInteractionRecord.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createInteractionRecord.fulfilled, (state, action) => {
        state.loading = false;
        state.interactions.unshift(action.payload);
      })
      .addCase(createInteractionRecord.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update interaction
      .addCase(updateInteractionRecord.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateInteractionRecord.fulfilled, (state, action) => {
        state.loading = false;
        const idx = state.interactions.findIndex(i => i.id === action.payload.id);
        if (idx !== -1) {
          state.interactions[idx] = action.payload;
        }
      })
      .addCase(updateInteractionRecord.rejected, (state) => {
        state.loading = false;
      })
      // Delete interaction
      .addCase(deleteInteractionRecord.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteInteractionRecord.fulfilled, (state, action) => {
        state.loading = false;
        state.interactions = state.interactions.filter(i => i.id !== action.payload);
      })
      .addCase(deleteInteractionRecord.rejected, (state) => {
        state.loading = false;
      });
  }
});

export default interactionSlice.reducer;
