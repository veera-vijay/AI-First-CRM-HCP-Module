import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchHcpById, clearCurrentHcp } from '../store/slices/hcpSlice';
import { fetchInteractions, deleteInteractionRecord } from '../store/slices/interactionSlice';
import { fetchFollowUps, toggleFollowUpStatus } from '../store/slices/followupSlice';
import {
  ArrowLeft,
  Building,
  GraduationCap,
  MapPin,
  Mail,
  Phone,
  Calendar,
  MessageSquare,
  Sparkles,
  Trash2,
  AlertCircle,
  CheckCircle2,
  CircleDot
} from 'lucide-react';
import { motion } from 'framer-motion';

const HcpDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { currentHcp, loading: hcpLoading } = useSelector((state) => state.hcp);
  const { interactions, loading: interactionsLoading } = useSelector((state) => state.interaction);
  const { followups, loading: followupsLoading } = useSelector((state) => state.followup);

  useEffect(() => {
    dispatch(fetchHcpById(id));
    dispatch(fetchInteractions({ hcp_id: id }));
    dispatch(fetchFollowUps());

    return () => {
      dispatch(clearCurrentHcp());
    };
  }, [dispatch, id]);

  const handleDeleteInteraction = (intId) => {
    if (window.confirm("Are you sure you want to delete this interaction log?")) {
      dispatch(deleteInteractionRecord(intId)).then(() => {
        dispatch(fetchInteractions({ hcp_id: id }));
      });
    }
  };

  const handleToggleTask = (taskId, currentStatus) => {
    const nextStatus = currentStatus === 'Pending' ? 'Completed' : 'Pending';
    dispatch(toggleFollowUpStatus({ id: taskId, status: nextStatus })).then(() => {
      dispatch(fetchFollowUps());
    });
  };

  if (hcpLoading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-24 skeleton-loading rounded-md"></div>
        <div className="h-40 w-full skeleton-loading rounded-2xl"></div>
      </div>
    );
  }

  if (!currentHcp) {
    return (
      <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-premium">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">Doctor Profile Not Found</h3>
        <p className="text-xs text-slate-400 mt-1">This profile may have been removed or does not exist.</p>
        <Link to="/hcps" className="text-xs text-primary-600 font-semibold hover:underline mt-4 inline-block">
          Return to directory
        </Link>
      </div>
    );
  }

  // Doctor metrics calculations
  const doctorFollowups = followups.filter(f => f.hcp_id === currentHcp.id && f.status === 'Pending');
  const avgScore = interactions.length > 0 
    ? Math.round(interactions.reduce((acc, curr) => acc + curr.interaction_score, 0) / interactions.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Back to list Link */}
      <Link to="/hcps" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 font-semibold transition-all">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to directory
      </Link>

      {/* Doctor Summary Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-premium">
        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary-100 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400 flex items-center justify-center font-black text-xl border-2 border-primary-50 dark:border-primary-950 shadow-premium">
              {currentHcp.name.split(' ').map(n=>n[0]).join('')}
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{currentHcp.name}</h2>
                <span className="px-2.5 py-0.5 text-xs font-bold border rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-950/30">
                  {currentHcp.status}
                </span>
              </div>
              <div className="text-xs text-slate-400 font-semibold flex items-center gap-4 flex-wrap">
                <span className="flex items-center gap-1"><GraduationCap className="w-4 h-4 text-slate-400" /> {currentHcp.specialization}</span>
                <span className="flex items-center gap-1"><Building className="w-4 h-4 text-slate-400" /> {currentHcp.hospital}</span>
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-slate-400" /> {currentHcp.location}</span>
              </div>
            </div>
          </div>

          {/* Quick Contact & Action */}
          <div className="flex flex-col gap-2.5 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 pt-4 md:pt-0 md:pl-6 text-xs text-slate-500 font-semibold justify-center">
            {currentHcp.email && <span className="flex items-center gap-2"><Mail className="w-4 h-4 text-slate-400" /> {currentHcp.email}</span>}
            {currentHcp.phone && <span className="flex items-center gap-2"><Phone className="w-4 h-4 text-slate-400" /> {currentHcp.phone}</span>}
          </div>
        </div>

        {/* Aggregate Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Visits</p>
            <h4 className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-1">{interactions.length}</h4>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Relationship Score</p>
            <h4 className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-1">{avgScore}/100</h4>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Reminders</p>
            <h4 className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-1">{doctorFollowups.length}</h4>
          </div>
        </div>
      </div>

      {/* Main Grid: Timeline & Reminders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Timeline history) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-premium">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary-600" />
              Interaction Timeline
            </h3>

            {interactionsLoading ? (
              <div className="space-y-4">
                <div className="h-16 w-full skeleton-loading rounded-xl"></div>
                <div className="h-16 w-full skeleton-loading rounded-xl"></div>
              </div>
            ) : interactions.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <Calendar className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No meetings logged yet</p>
                <p className="text-xs text-slate-400 mt-0.5">Use the interaction logger to record visit logs.</p>
              </div>
            ) : (
              <div className="relative border-l-2 border-slate-100 dark:border-slate-800 ml-4 pl-6 space-y-6">
                {interactions.map((item) => (
                  <div key={item.id} className="relative group">
                    {/* Circle Indicator on timeline line */}
                    <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-white dark:bg-slate-900 border-2 border-primary-600 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-600"></div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/40 p-4.5 rounded-xl border border-slate-100 dark:border-slate-800/70 hover:border-slate-200 dark:hover:border-slate-800 transition-all">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <p className="text-xs text-slate-400 font-bold">{item.meeting_date} ({item.meeting_type})</p>
                          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1.5">{item.summary}</h4>
                        </div>
                        {/* Actions */}
                        <div className="flex gap-2">
                          <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                            item.sentiment === 'Positive' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            item.sentiment === 'Negative' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                            'bg-amber-50 text-amber-600 border-amber-100'
                          }`}>
                            {item.sentiment}
                          </span>
                          <button
                            onClick={() => handleDeleteInteraction(item.id)}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {item.doctor_feedback && (
                        <blockquote className="mt-3 text-xs italic text-slate-500 border-l-2 border-slate-200 dark:border-slate-800 pl-3 leading-relaxed">
                          "{item.doctor_feedback}"
                        </blockquote>
                      )}

                      {/* Products Discussed */}
                      {item.products && item.products.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3.5">
                          {item.products.map(p => (
                            <span key={p.id} className="text-[10px] bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded font-bold uppercase tracking-wide">
                              {p.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (Reminders list) */}
        <div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-premium">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-5">Scheduled Tasks</h3>

            {followupsLoading ? (
              <div className="space-y-2">
                <div className="h-10 w-full skeleton-loading rounded-md"></div>
              </div>
            ) : doctorFollowups.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <CheckCircle2 className="w-9 h-9 text-emerald-500 mx-auto mb-1.5" />
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">All caught up!</p>
                <p className="text-[10px] text-slate-400 mt-0.5">No pending tasks for this doctor.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {doctorFollowups.map(task => (
                  <div key={task.id} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/70">
                    <button
                      onClick={() => handleToggleTask(task.id, task.status)}
                      className="mt-0.5 text-slate-300 hover:text-primary-600 dark:text-slate-700 dark:hover:text-primary-400 focus:outline-none transition-colors flex-shrink-0"
                    >
                      <CircleDot className="w-5 h-5" />
                    </button>
                    <div>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">
                        {task.description}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold mt-1.5 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" /> Due: {task.follow_up_date}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default HcpDetails;
