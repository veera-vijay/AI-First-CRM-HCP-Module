import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { logout } from '../store/slices/authSlice';
import { toggleSidebar, toggleDarkMode } from '../store/slices/uiSlice';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  History,
  Settings,
  Menu,
  ChevronLeft,
  LogOut,
  Sun,
  Moon,
  User as UserIcon,
  Bell,
  Search,
  MessageSquareDiff
} from 'lucide-react';
import { motion } from 'framer-motion';

const Layout = ({ children }) => {
  const { sidebarOpen, darkMode } = useSelector((state) => state.ui);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const navigationItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'HCP List', path: '/hcps', icon: Users },
    { name: 'Log Interaction', path: '/log-interaction', icon: MessageSquareDiff },
    { name: 'Interaction History', path: '/history', icon: History },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const getPageTitle = () => {
    const matched = navigationItems.find(item => item.path === location.pathname);
    if (matched) return matched.name;
    if (location.pathname.startsWith('/hcp/')) return 'HCP Profile Details';
    return 'Pharma CRM';
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-200">
      
      {/* SIDEBAR NAVIGATION */}
      <aside
        className={`fixed inset-y-0 left-0 z-20 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* LOGO AREA */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary-600 text-white shadow-premium">
              <CalendarDays className="w-5 h-5" />
            </div>
            {sidebarOpen && (
              <span className="text-base font-bold bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent truncate">
                OmniPharma AI
              </span>
            )}
          </div>
          {sidebarOpen && (
            <button
              onClick={() => dispatch(toggleSidebar())}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="flex-grow p-4 space-y-1">
          {navigationItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-3 py-2.5 rounded-xl font-medium transition-all group relative ${
                  isActive
                    ? 'bg-primary-50 text-primary-600 dark:bg-primary-950/30 dark:text-primary-400'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50'
                }`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="text-sm truncate">{item.name}</span>}
              {!sidebarOpen && (
                <div className="absolute left-16 bg-slate-900 dark:bg-slate-800 text-white text-xs px-2.5 py-1.5 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap shadow-premium z-50">
                  {item.name}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* LOGOUT BUTTON IN SIDEBAR */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3.5 w-full px-3 py-2.5 rounded-xl font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all group relative"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm">Sign Out</span>}
            {!sidebarOpen && (
              <div className="absolute left-16 bg-rose-600 text-white text-xs px-2.5 py-1.5 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap shadow-premium z-50">
                Sign Out
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* HEADER & MAIN CONTENT AREA */}
      <div
        className={`flex-grow flex flex-col min-h-screen transition-all duration-300 ${
          sidebarOpen ? 'pl-64' : 'pl-20'
        }`}
      >
        {/* HEADER BAR */}
        <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-6 bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            {!sidebarOpen && (
              <button
                onClick={() => dispatch(toggleSidebar())}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {getPageTitle()}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Search Bar Placeholder for premium look */}
            <div className="relative hidden md:block w-64">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search CRM..."
                className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border-none focus:ring-1 focus:ring-primary-500 focus:outline-none dark:text-slate-100"
              />
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => dispatch(toggleDarkMode())}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-500" />}
            </button>

            {/* Notification Bell */}
            <button className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary-600"></span>
            </button>

            {/* User Dropdown Menu */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2.5 focus:outline-none"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-premium border-2 border-white dark:border-slate-800">
                  {user?.full_name ? user.full_name.split(' ').map(n=>n[0]).join('') : 'U'}
                </div>
                <span className="hidden sm:block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {user?.full_name || 'Medical Representative'}
                </span>
              </button>

              {profileDropdownOpen && (
                <>
                  <div
                    onClick={() => setProfileDropdownOpen(false)}
                    className="fixed inset-0 z-30 bg-transparent"
                  ></div>
                  <div className="absolute right-0 mt-2.5 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-premium-lg p-1.5 z-40">
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                      <p className="text-xs text-slate-400">Signed in as</p>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{user?.username}</p>
                    </div>
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        navigate('/settings');
                      }}
                      className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 rounded-lg transition-all"
                    >
                      <UserIcon className="w-4 h-4" />
                      My Profile
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-all text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-grow p-6 md:p-8">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="max-w-7xl mx-auto h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
