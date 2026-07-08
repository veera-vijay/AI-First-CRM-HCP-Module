import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchHcps, createHcpProfile } from '../store/slices/hcpSlice';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  Search,
  Filter,
  UserPlus,
  ArrowUpDown,
  Building,
  GraduationCap,
  MapPin,
  Mail,
  Phone,
  X,
  Plus,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const HcpList = () => {
  const dispatch = useDispatch();
  const { hcps, loading } = useSelector((state) => state.hcp);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [specFilter, setSpecFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  useEffect(() => {
    dispatch(fetchHcps({
      name: searchTerm,
      specialization: specFilter,
      status: statusFilter
    }));
  }, [dispatch, searchTerm, specFilter, statusFilter]);

  const onAddHcp = (data) => {
    dispatch(createHcpProfile(data)).then((res) => {
      if (res.meta.requestStatus === 'fulfilled') {
        reset();
        setModalOpen(false);
      }
    });
  };

  const getStatusBadgeClass = (status) => {
    return status === 'Active'
      ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-950/30'
      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700';
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Healthcare Professionals (HCPs)</h2>
          <p className="text-xs text-slate-400">Directory of registered clinic, hospital, and specialist contacts</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-premium"
        >
          <UserPlus className="w-4 h-4" />
          Add New HCP
        </button>
      </div>

      {/* Filter and Query Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-premium flex flex-col md:flex-row gap-4 items-center">
        {/* Name Search */}
        <div className="relative w-full md:flex-grow">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search by doctor name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 focus:ring-1 focus:ring-primary-500 focus:outline-none dark:text-slate-100"
          />
        </div>

        {/* Specialization Filter */}
        <div className="relative w-full md:w-48">
          <select
            value={specFilter}
            onChange={(e) => setSpecFilter(e.target.value)}
            className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 focus:ring-1 focus:ring-primary-500 focus:outline-none dark:text-slate-100 appearance-none font-semibold cursor-pointer"
          >
            <option value="">All Specializations</option>
            <option value="Cardiology">Cardiology</option>
            <option value="Neurology">Neurology</option>
            <option value="Endocrinology">Endocrinology</option>
            <option value="Pulmonology">Pulmonology</option>
            <option value="Oncology">Oncology</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="relative w-full md:w-44">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 focus:ring-1 focus:ring-primary-500 focus:outline-none dark:text-slate-100 appearance-none font-semibold cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Skeletons/Data Table */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-premium">
          <div className="p-6 space-y-4">
            <div className="h-10 w-full skeleton-loading rounded-xl"></div>
            <div className="h-10 w-full skeleton-loading rounded-xl"></div>
            <div className="h-10 w-full skeleton-loading rounded-xl"></div>
          </div>
        </div>
      ) : hcps.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-premium">
          <Users className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">No Doctors Found</h3>
          <p className="text-xs text-slate-400 mt-1">Try widening your filters or register a new HCP using the button above.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-premium">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="py-4 px-6">Name</th>
                  <th className="py-4 px-4">Specialization</th>
                  <th className="py-4 px-4">Hospital / Affiliation</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-300">
                {hcps.map((hcp) => (
                  <tr key={hcp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-800 dark:text-slate-100">{hcp.name}</div>
                      <div className="text-xs text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" /> {hcp.location}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400">
                        <GraduationCap className="w-3.5 h-3.5" />
                        {hcp.specialization}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5">
                        <Building className="w-4 h-4 text-slate-400" />
                        <span>{hcp.hospital}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-bold border rounded-full ${getStatusBadgeClass(hcp.status)}`}>
                        {hcp.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        to={`/hcp/${hcp.id}`}
                        className="text-xs bg-slate-100 hover:bg-primary-50 dark:bg-slate-800 dark:hover:bg-primary-950/40 text-slate-600 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400 px-3.5 py-2 rounded-xl transition-all"
                      >
                        View Profile
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add HCP Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-premium-lg overflow-hidden"
            >
              <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-primary-600" />
                  Register Doctor Profile
                </h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onAddHcp)} className="p-6 space-y-4">
                {/* Form fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Doctor Full Name</label>
                    <input
                      type="text"
                      {...register('name', { required: 'Name is required' })}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 focus:ring-1 focus:ring-primary-500 focus:outline-none dark:text-slate-100"
                      placeholder="e.g. Dr. Rajesh Kumar"
                    />
                    {errors.name && <span className="text-xs text-rose-500 mt-1">{errors.name.message}</span>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Specialization</label>
                    <select
                      {...register('specialization', { required: 'Specialization is required' })}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 focus:ring-1 focus:ring-primary-500 focus:outline-none dark:text-slate-100 cursor-pointer"
                    >
                      <option value="">Select Specialization</option>
                      <option value="Cardiology">Cardiology</option>
                      <option value="Neurology">Neurology</option>
                      <option value="Endocrinology">Endocrinology</option>
                      <option value="Pulmonology">Pulmonology</option>
                      <option value="Oncology">Oncology</option>
                    </select>
                    {errors.specialization && <span className="text-xs text-rose-500 mt-1">{errors.specialization.message}</span>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Hospital / Affiliation</label>
                    <input
                      type="text"
                      {...register('hospital', { required: 'Hospital is required' })}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 focus:ring-1 focus:ring-primary-500 focus:outline-none dark:text-slate-100"
                      placeholder="e.g. Apollo Hospital"
                    />
                    {errors.hospital && <span className="text-xs text-rose-500 mt-1">{errors.hospital.message}</span>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Location / City</label>
                    <input
                      type="text"
                      {...register('location', { required: 'Location is required' })}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 focus:ring-1 focus:ring-primary-500 focus:outline-none dark:text-slate-100"
                      placeholder="e.g. New Delhi"
                    />
                    {errors.location && <span className="text-xs text-rose-500 mt-1">{errors.location.message}</span>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Email Address</label>
                    <input
                      type="email"
                      {...register('email')}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 focus:ring-1 focus:ring-primary-500 focus:outline-none dark:text-slate-100"
                      placeholder="e.g. dr.rajesh@apollo.com"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Phone Number</label>
                    <input
                      type="text"
                      {...register('phone')}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 focus:ring-1 focus:ring-primary-500 focus:outline-none dark:text-slate-100"
                      placeholder="e.g. +91 9876543210"
                    />
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-slate-200 dark:border-slate-800 mt-6">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4.5 py-2.5 text-sm font-semibold rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-4.5 py-2.5 text-sm font-semibold rounded-xl bg-primary-600 hover:bg-primary-700 disabled:bg-primary-500 text-white transition-all shadow-premium"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Add Doctor
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HcpList;
