import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import hcpReducer from './slices/hcpSlice';
import interactionReducer from './slices/interactionSlice';
import chatReducer from './slices/chatSlice';
import followupReducer from './slices/followupSlice';
import notificationReducer from './slices/notificationSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    hcp: hcpReducer,
    interaction: interactionReducer,
    chat: chatReducer,
    followup: followupReducer,
    notification: notificationReducer,
    ui: uiReducer,
  },
});

export default store;
