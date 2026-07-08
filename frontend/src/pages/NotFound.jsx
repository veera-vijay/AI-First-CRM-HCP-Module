import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowRight } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 p-6">
      <div className="text-center space-y-6 max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-400 shadow-premium animate-bounce">
          <Compass className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight">404</h1>
        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">Page Not Found</h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          The view you are looking for doesn't exist or has been shifted. Let's redirect you back to safety.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-premium hover:shadow-premium-lg transition-all"
        >
          Return to Dashboard
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
