import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { removeToast } from '../store/slices/notificationSlice';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ToastContainer = () => {
  const { toasts } = useSelector((state) => state.notification);
  const dispatch = useDispatch();

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-rose-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBorderColor = (type) => {
    switch (type) {
      case 'success':
        return 'border-emerald-100 dark:border-emerald-950/30 bg-emerald-50/90 dark:bg-emerald-950/20';
      case 'warning':
        return 'border-amber-100 dark:border-amber-950/30 bg-amber-50/90 dark:bg-amber-950/20';
      case 'error':
        return 'border-rose-100 dark:border-rose-950/30 bg-rose-50/90 dark:bg-rose-950/20';
      default:
        return 'border-blue-100 dark:border-blue-950/30 bg-blue-50/90 dark:bg-blue-950/20';
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-md w-full">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
            layout
            className={`flex items-start p-4 border rounded-xl shadow-premium backdrop-blur-sm ${getBorderColor(toast.type)}`}
          >
            <div className="flex-shrink-0 mr-3 mt-0.5">
              {getIcon(toast.type)}
            </div>
            <div className="flex-grow text-sm font-medium text-slate-800 dark:text-slate-200">
              {toast.message}
            </div>
            <button
              onClick={() => dispatch(removeToast(toast.id))}
              className="flex-shrink-0 ml-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ToastContainer;
