import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleDarkMode } from '../store/slices/uiSlice';
import api from '../utils/api';
import {
  Settings as SettingsIcon,
  Sun,
  Moon,
  Database,
  Cpu,
  User,
  ShieldCheck,
  Loader2,
  HardDrive
} from 'lucide-react';

const Settings = () => {
  const dispatch = useDispatch();
  const { darkMode } = useSelector((state) => state.ui);
  const { user } = useSelector((state) => state.auth);

  const [systemStatus, setSystemStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setLoading(true);
        const res = await api.get('/api/status');
        setSystemStatus(res.data);
      } catch (err) {
        console.error("Failed to load diagnostic status", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, []);

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Portal Settings & Diagnostics</h2>
        <p className="text-xs text-slate-400">Configure preferences and inspect environment connections</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        
        {/* Profile Details Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-premium">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2.5 mb-5">
            <User className="w-5 h-5 text-primary-600" />
            Representative Profile
          </h3>
          
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-premium border-2 border-white dark:border-slate-800">
              {user?.full_name ? user.full_name.split(' ').map(n=>n[0]).join('') : 'U'}
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">{user?.full_name || 'Medical Representative'}</h4>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-0.5">{user?.role || 'Field Sales agent'}</p>
            </div>
          </div>
        </div>

        {/* Display preferences Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-premium">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2.5 mb-5">
            <SettingsIcon className="w-5 h-5 text-primary-600" />
            Display Preferences
          </h3>
          
          <div className="flex justify-between items-center py-2.5">
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Dark Mode Interface</p>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">Toggle default high-contrast dark theme background</p>
            </div>
            <button
              onClick={() => dispatch(toggleDarkMode())}
              className={`p-2.5 rounded-xl border transition-all ${
                darkMode
                  ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700'
                  : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* System Diagnostics Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-premium">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2.5 mb-5">
            <ShieldCheck className="w-5 h-5 text-primary-600" />
            Environment Diagnostics
          </h3>

          {loading ? (
            <div className="flex items-center gap-2.5 py-4 text-xs font-semibold text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
              Verifying system channels...
            </div>
          ) : !systemStatus ? (
            <div className="text-xs text-rose-500 py-2">
              Failed to connect to diagnostic service.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 space-y-4">
              
              {/* Database Connection */}
              <div className="flex justify-between items-start py-3 first:pt-0">
                <div className="flex gap-3">
                  <Database className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">PostgreSQL Database</p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">Host URL: {systemStatus.database_url}</p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-950/30">
                  Online
                </span>
              </div>

              {/* Groq API */}
              <div className="flex justify-between items-start py-3">
                <div className="flex gap-3">
                  <Cpu className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Groq LLM Integration (LangGraph)</p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">
                      Models: Primary ({systemStatus.models.primary}) | Context ({systemStatus.models.context})
                    </p>
                  </div>
                </div>
                <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${
                  systemStatus.groq_api_status.includes("Active")
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400'
                    : 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-450'
                }`}>
                  {systemStatus.groq_api_status}
                </span>
              </div>

              {/* LangGraph Core */}
              <div className="flex justify-between items-start py-3 last:pb-0">
                <div className="flex gap-3">
                  <HardDrive className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">LangGraph Orchestration</p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">StateGraph compiled with Intent Detection & Entity Extraction nodes</p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-950/30">
                  Compiles OK
                </span>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Settings;
