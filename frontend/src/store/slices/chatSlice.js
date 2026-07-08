import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';
import { addToast } from './notificationSlice';

export const fetchChatHistory = createAsyncThunk(
  'chat/fetchHistory',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/chat/history');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to load chat history.');
    }
  }
);

export const sendMessageToChat = createAsyncThunk(
  'chat/sendMessage',
  async (messageText, { rejectWithValue, dispatch }) => {
    try {
      // 1. Instantly return user message to append locally
      const response = await api.post('/api/chat', { message: messageText });
      
      const { reply, intent, extracted_entities, success, validation_errors } = response.data;
      
      if (success) {
        dispatch(addToast({ message: 'AI successfully extracted and staged interaction!', type: 'success' }));
      } else if (validation_errors && validation_errors.length > 0) {
        dispatch(addToast({ message: 'Validation issues: ' + validation_errors.join(', '), type: 'warning' }));
      }
      
      return {
        userMessage: messageText,
        aiMessage: reply,
        intent,
        extracted_entities,
        success,
        validation_errors
      };
    } catch (error) {
      const msg = error.response?.data?.detail || 'Failed to communicate with AI CRM Agent.';
      dispatch(addToast({ message: msg, type: 'error' }));
      return rejectWithValue(msg);
    }
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    messages: [], // array of { sender: 'user'|'ai', text: string, timestamp: Date }
    extractionPreview: null, // ExtractedEntitiesDict
    intent: null,
    success: false,
    validationErrors: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearChat: (state) => {
      state.messages = [];
      state.extractionPreview = null;
      state.intent = null;
      state.success = false;
      state.validationErrors = [];
    },
    updateExtractionField: (state, action) => {
      if (state.extractionPreview) {
        const { field, value } = action.payload;
        state.extractionPreview[field] = value;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch history
      .addCase(fetchChatHistory.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchChatHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.messages = action.payload.map(item => ({
          sender: item.sender,
          text: item.message,
          timestamp: item.timestamp
        }));
      })
      .addCase(fetchChatHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Send message
      .addCase(sendMessageToChat.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendMessageToChat.fulfilled, (state, action) => {
        state.loading = false;
        // Append user message if not already present
        state.messages.push({
          sender: 'user',
          text: action.payload.userMessage,
          timestamp: new Date().toISOString()
        });
        // Append AI reply
        state.messages.push({
          sender: 'ai',
          text: action.payload.aiMessage,
          timestamp: new Date().toISOString()
        });
        
        state.intent = action.payload.intent;
        state.extractionPreview = action.payload.extracted_entities;
        state.success = action.payload.success;
        state.validationErrors = action.payload.validation_errors;
      })
      .addCase(sendMessageToChat.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearChat, updateExtractionField } = chatSlice.actions;
export default chatSlice.reducer;
