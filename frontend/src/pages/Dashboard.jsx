import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFollowUps, toggleFollowUpStatus } from '../store/slices/followupSlice';
import api from '../utils/api';
import {
  Users,
  MessageSquare,
  ClipboardList,
  CalendarRange,
  ArrowUpRight,
  TrendingUp,
  CircleDot,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const dispatch = useDispatch();
  const { followups, loading: followupsLoading } = useSelector((state) => state.followup);
  const { user } = useSelector((state) => state.auth);
  
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const res = await api.get('/api/dashboard/stats');
      setStats(res.data);
    } catch (err) {
      console.error("Error loading dashboard stats", err);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    dispatch(fetchFollowUps('Pending'));
  }, [dispatch]);

  const handleToggleTask = (id, currentStatus) => {
    const nextStatus = currentStatus === 'Pending' ? 'Completed' : 'Pending';
    dispatch(toggleFollowUpStatus({ id, status: nextStatus })).then(() => {
      fetchStats(); // refresh total metrics
    });
  };

  // Safe variables
  const totalInteractions = stats?.total_interactions ?? 0;
  const totalHcps = stats?.total_hcps ?? 0;
  const pendingFollowupsCount = stats?.pending_followups ?? 0;
  const avgScore = stats?.average_score ?? 0.0;
  const sentimentStats = stats?.sentiment_distribution ?? [];
  const activityLogs = stats?.recent_logs ?? [];

  // Calculate SVG Pie/Donut Chart parameters
  const totalSentiment = sentimentStats.reduce((sum, item) => sum + item.count, 0) || 1;
  const positiveItem = sentimentStats.find(s => s.sentiment === 'Positive')?.count ?? 0;
  const neutralItem = sentimentStats.find(s => s.sentiment === 'Neutral')?.count ?? 0;
  const negativeItem = sentimentStats.find(s => s.sentiment === 'Negative')?.count ?? 0;

  const posPct = Math.round((positiveItem / totalSentiment) * 100);
  const neuPct = Math.round((neutralItem / totalSentiment) * 100);
  const negPct = Math.round((negativeItem / totalSentiment) * 100);

  // SVG parameters
  const strokeDashoffsetPos = 440 - (440 * posPct) / 100;
  const strokeDashoffsetNeu = 440 - (440 * (posPct + neuPct)) / 100;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-primary-600 to-indigo-600 dark:from-primary-950 dark:to-indigo-950 p-6 md:p-8 rounded-2xl shadow-premium text-white">
        <div>
          <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2.5">
            Hello, {user?.full_name || 'Medical Representative'}
            <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
          </h2>
          <p className="text-sm text-primary-100 mt-1 max-w-lg">
            Track healthcare relationships, log interaction logs, and schedule reminders. Use AI Chat to draft records conversationally.
          </p>
        </div>
        <Link
          to="/log-interaction"
          className="flex items-center gap-2 bg-white text-primary-600 dark:bg-slate-900 dark:text-primary-400 font-semibold px-5 py-2.5 rounded-xl shadow-premium hover:shadow-premium-lg transition-all text-sm flex-shrink-0"
        >
          Log New Interaction
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-premium relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Interactions</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1.5">
                {statsLoading ? <div className="h-7 w-12 skeleton-loading rounded-md"></div> : totalInteractions}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-4 flex items-center gap-1 font-medium">
            <span className="text-emerald-500 flex items-center font-bold">
              <ArrowUpRight className="w-3 h-3" /> +12%
            </span>
            since last month
          </p>
        </div>

        {/* Card 2 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-premium relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active HCPs</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1.5">
                {statsLoading ? <div className="h-7 w-12 skeleton-loading rounded-md"></div> : totalHcps}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-4 flex items-center gap-1 font-medium">
            <span className="text-emerald-500 flex items-center font-bold">
              <ArrowUpRight className="w-3 h-3" /> +2
            </span>
            added this week
          </p>
        </div>

        {/* Card 3 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-premium relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pending Tasks</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1.5">
                {statsLoading ? <div className="h-7 w-12 skeleton-loading rounded-md"></div> : pendingFollowupsCount}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <ClipboardList className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-4 flex items-center gap-1 font-medium">
            Requires follow-up shortly
          </p>
        </div>

        {/* Card 4 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-premium relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Relationship Score</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1.5">
                {statsLoading ? <div className="h-7 w-12 skeleton-loading rounded-md"></div> : `${avgScore} / 100`}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-4 flex items-center gap-1 font-medium">
            Based on sentiment metrics
          </p>
        </div>
      </div>

      {/* Main Grid: Checklist & Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left/Middle Column (Tasks & Timeline) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Follow-up Checklist */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-premium">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Pending Reminders</h3>
                <p className="text-xs text-slate-400">Critical action items stemming from medical visits</p>
              </div>
              <Link to="/history" className="text-xs text-primary-600 dark:text-primary-400 font-semibold hover:underline">
                View All History
              </Link>
            </div>

            {followupsLoading ? (
              <div className="space-y-3">
                <div className="h-12 w-full skeleton-loading rounded-xl"></div>
                <div className="h-12 w-full skeleton-loading rounded-xl"></div>
              </div>
            ) : followups.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">All caught up!</p>
                <p className="text-xs text-slate-400 mt-0.5">No pending doctor follow-up tasks registered.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[300px] overflow-y-auto pr-1">
                {followups.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-start justify-between py-3.5 first:pt-0 last:pb-0 group">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => handleToggleTask(task.id, task.status)}
                        className="mt-0.5 text-slate-300 hover:text-primary-600 dark:text-slate-700 dark:hover:text-primary-400 focus:outline-none transition-colors"
                      >
                        <CircleDot className="w-5 h-5" />
                      </button>
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                          {task.description}
                        </p>
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                          <Users className="w-3 h-3" />
                          <Link to={`/hcp/${task.hcp_id}`} className="hover:underline font-medium text-slate-500 dark:text-slate-400">
                            {task.hcp.name}
                          </Link>
                          <span>•</span>
                          <Calendar className="w-3 h-3" />
                          <span>Due: {task.follow_up_date}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Activity Logs Timeline */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-premium">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-5">System Audit Logs</h3>
            
            {statsLoading ? (
              <div className="space-y-3">
                <div className="h-8 w-2/3 skeleton-loading rounded-md"></div>
                <div className="h-8 w-1/2 skeleton-loading rounded-md"></div>
              </div>
            ) : activityLogs.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">No system logs logged yet.</p>
            ) : (
              <div className="space-y-4">
                {activityLogs.map((log, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary-600 mt-1.5 flex-shrink-0"></div>
                    <span className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">{log}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (Donut Chart Analytics) */}
        <div className="space-y-6">
          {/* Sentiment Distribution Pie Chart */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-premium flex flex-col justify-between h-full">
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Doctor Sentiments</h3>
              <p className="text-xs text-slate-400">Aggregated from logged feedback</p>
            </div>

            {statsLoading ? (
              <div className="flex justify-center items-center py-10">
                <div className="w-32 h-32 rounded-full skeleton-loading"></div>
              </div>
            ) : totalInteractions === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No sentiment data. Log your first visit to construct analysis.
              </div>
            ) : (
              <div className="my-6 flex justify-center items-center relative">
                {/* SVG circular donut chart */}
                <svg className="w-40 h-40 transform -rotate-90">
                  {/* Background track */}
                  <circle cx="80" cy="80" r="70" stroke="#f1f5f9" strokeWidth="14" fill="transparent" className="dark:stroke-slate-800" />
                  
                  {/* Positive Slice */}
                  {posPct > 0 && (
                    <circle
                      cx="80" cy="80" r="70"
                      stroke="#10b981" strokeWidth="14" fill="transparent"
                      strokeDasharray="440"
                      strokeDashoffset={440 - (440 * posPct) / 100}
                    />
                  )}
                  {/* Neutral Slice */}
                  {neuPct > 0 && (
                    <circle
                      cx="80" cy="80" r="70"
                      stroke="#f59e0b" strokeWidth="14" fill="transparent"
                      strokeDasharray="440"
                      strokeDashoffset={strokeDashoffsetPos}
                    />
                  )}
                  {/* Negative Slice */}
                  {negPct > 0 && (
                    <circle
                      cx="80" cy="80" r="70"
                      stroke="#ef4444" strokeWidth="14" fill="transparent"
                      strokeDasharray="440"
                      strokeDashoffset={strokeDashoffsetNeu}
                    />
                  )}
                </svg>

                {/* Circular Center Label */}
                <div className="absolute text-center">
                  <span className="block text-2xl font-black text-slate-800 dark:text-slate-100">
                    {posPct}%
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                    Positive
                  </span>
                </div>
              </div>
            )}

            {/* Custom Legend */}
            <div className="space-y-2 mt-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 block"></span>
                  Positive ({positiveItem})
                </span>
                <span className="text-slate-700 dark:text-slate-200">{posPct}%</span>
              </div>
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <span className="w-3 h-3 rounded-full bg-amber-500 block"></span>
                  Neutral ({neutralItem})
                </span>
                <span className="text-slate-700 dark:text-slate-200">{neuPct}%</span>
              </div>
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <span className="w-3 h-3 rounded-full bg-rose-500 block"></span>
                  Negative ({negativeItem})
                </span>
                <span className="text-slate-700 dark:text-slate-200">{negPct}%</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
