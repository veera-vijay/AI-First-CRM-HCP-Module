import { createSlice } from '@reduxjs/toolkit';

// Retrieve initial dark mode preference from localStorage
const getInitialDarkMode = () => {
  const saved = localStorage.getItem('darkMode');
  if (saved !== null) {
    return saved === 'true';
  }
  // Fallback to system preference
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    sidebarOpen: true,
    darkMode: getInitialDarkMode(),
    activeView: 'dashboard',
  },
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
      localStorage.setItem('darkMode', state.darkMode);
      
      // Update the class on HTML element
      if (state.darkMode) {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      }
    },
    setActiveView: (state, action) => {
      state.activeView = action.payload;
    }
  }
});

export const { toggleSidebar, setSidebarOpen, toggleDarkMode, setActiveView } = uiSlice.actions;
export default uiSlice.reducer;
