import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCurrentUser } from './store/slices/authSlice';

// Core Layouts
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import ToastContainer from './components/ToastContainer';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import HcpList from './pages/HcpList';
import HcpDetails from './pages/HcpDetails';
import LogInteraction from './pages/LogInteraction';
import InteractionHistory from './pages/InteractionHistory';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

function App() {
  const dispatch = useDispatch();
  const { token, user } = useSelector((state) => state.auth);

  useEffect(() => {
    // If a token exists but user isn't loaded yet, fetch profile
    if (token && !user) {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch, token, user]);

  return (
    <Router>
      <Routes>
        {/* Public Login Route */}
        <Route path="/login" element={<Login />} />

        {/* Private Dashboard & HCP Routes */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/hcps"
          element={
            <PrivateRoute>
              <Layout>
                <HcpList />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/hcp/:id"
          element={
            <PrivateRoute>
              <Layout>
                <HcpDetails />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/log-interaction"
          element={
            <PrivateRoute>
              <Layout>
                <LogInteraction />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/history"
          element={
            <PrivateRoute>
              <Layout>
                <InteractionHistory />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <Layout>
                <Settings />
              </Layout>
            </PrivateRoute>
          }
        />

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* Global Toast Alerts Stack */}
      <ToastContainer />
    </Router>
  );
}

export default App;
