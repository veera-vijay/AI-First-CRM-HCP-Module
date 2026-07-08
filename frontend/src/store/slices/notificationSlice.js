import { createSlice } from '@reduxjs/toolkit';

const notificationSlice = createSlice({
  name: 'notification',
  initialState: {
    toasts: [], // array of { id, message, type: 'success' | 'error' | 'info' | 'warning' }
  },
  reducers: {
    addToast: (state, action) => {
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
      const { message, type = 'info' } = action.payload;
      state.toasts.push({ id, message, type });
    },
    removeToast: (state, action) => {
      state.toasts = state.toasts.filter(toast => toast.id !== action.payload);
    }
  }
});

export const { addToast, removeToast } = notificationSlice.actions;
export default notificationSlice.reducer;
