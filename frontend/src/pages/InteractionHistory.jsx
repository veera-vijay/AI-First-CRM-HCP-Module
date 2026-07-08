import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchInteractions, deleteInteractionRecord } from '../store/slices/interactionSlice';
import { Link } from 'react-router-dom';
import {
  Calendar,
  MessageSquare,
  Search,
  Trash2,
  Building,
  User,
  AlertCircle
} from 'lucide-react';

const InteractionHistory = () => {
  const dispatch = useDispatch();
  const { interactions, loading } = useSelector((state) => state.interaction);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    dispatch(fetchInteractions());
  }, [dispatch]);

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this interaction log?")) {
      dispatch(deleteInteractionRecord(id));
    }
  };

  // Filter based on search query (by doctor name, summary, products, or hospital)
  const filteredInteractions = interactions.filter((item) => {
    const q = searchQuery.toLowerCase();
    const docName = item.hcp?.name?.toLowerCase() || '';
    const summary = item.summary?.toLowerCase() || '';
    const feedback = item.doctor_feedback?.toLowerCase() || '';
    const hospital = item.hcp?.hospital?.toLowerCase() || '';
    const products = item.products?.map(p => p.name.toLowerCase()).join(' ') || '';
    
    return docName.includes(q) || summary.includes(q) || feedback.includes(q) || hospital.includes(q) || products.includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Interaction History</h2>
        <p className="text-xs text-slate-400">Global timeline log of all medical representative calls and doctor visits</p>
      </div>

      {/* Search Filter */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-premium">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search interactions by doctor name, hospital, summary keyword, or products discussed..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 focus:ring-1 focus:ring-primary-500 focus:outline-none dark:text-slate-100"
          />
        </div>
      </div>

      {/* Skeletons/Data list */}
      {loading ? (
        <div className="space-y-4">
          <div className="h-28 w-full skeleton-loading rounded-2xl"></div>
          <div className="h-28 w-full skeleton-loading rounded-2xl"></div>
        </div>
      ) : filteredInteractions.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-premium">
          <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">No Interactions Found</h3>
          <p className="text-xs text-slate-400 mt-1">There are no matching logged visits in history.</p>
        </div>
      ) : (
        <div className="space-y-4.5">
          {filteredInteractions.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5.5 shadow-premium hover:shadow-premium-lg transition-all group relative"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                
                {/* Doctor/Clinic Details */}
                <div className="space-y-1.5 flex-grow">
                  <div className="flex items-center gap-3.5 flex-wrap">
                    <Link
                      to={`/hcp/${item.hcp_id}`}
                      className="text-base font-bold text-slate-800 dark:text-slate-100 hover:text-primary-600 dark:hover:text-primary-400 hover:underline"
                    >
                      {item.hcp?.name || 'Unknown Doctor'}
                    </Link>
                    <span className="text-xs text-slate-400 font-bold">•</span>
                    <span className="text-xs text-slate-400 font-bold flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {item.meeting_date}
                    </span>
                    <span className="text-xs text-slate-400 font-bold">•</span>
                    <span className="text-xs text-slate-500 font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">
                      {item.meeting_type}
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    <span>{item.hcp?.hospital} ({item.hcp?.location})</span>
                  </div>

                  {/* Summary */}
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-3 leading-relaxed">
                    {item.summary}
                  </p>

                  {/* Feedback Quote */}
                  {item.doctor_feedback && (
                    <blockquote className="mt-2.5 text-xs italic text-slate-500 border-l-2 border-slate-200 dark:border-slate-850 pl-3 leading-relaxed">
                      "{item.doctor_feedback}"
                    </blockquote>
                  )}

                  {/* Products tags */}
                  {item.products && item.products.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-3">
                      {item.products.map(p => (
                        <span
                          key={p.id}
                          className="text-[9.5px] bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded font-black uppercase tracking-wider"
                        >
                          {p.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right side tags/delete button */}
                <div className="flex sm:flex-col items-end gap-2.5 justify-between w-full sm:w-auto mt-4 sm:mt-0 flex-shrink-0 self-stretch sm:self-auto border-t sm:border-t-0 border-slate-100 dark:border-slate-850 pt-3.5 sm:pt-0">
                  <div className="flex gap-2">
                    <span className={`inline-flex px-2.5 py-0.5 text-xs font-bold rounded-full border ${
                      item.sentiment === 'Positive' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-950/30' :
                      item.sentiment === 'Negative' ? 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-950/30' :
                      'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-950/30'
                    }`}>
                      {item.sentiment}
                    </span>
                    <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-bold px-2 py-0.5 border border-indigo-100 dark:border-indigo-950/30 rounded-full flex items-center">
                      Score: {item.interaction_score}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none sm:opacity-0 group-hover:opacity-100 transition-opacity self-end mt-auto transition-colors"
                    title="Delete log"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InteractionHistory;
