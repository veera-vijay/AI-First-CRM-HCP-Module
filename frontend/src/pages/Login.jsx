import React from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../store/slices/authSlice';
import { useNavigate, Navigate } from 'react-router-dom';
import { LogIn, Loader2, ShieldCheck } from 'lucide-react';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, isAuthenticated } = useSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      username: 'rep1',
      password: 'password123'
    }
  });

  // Redirect if already logged in
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = (data) => {
    dispatch(loginUser(data)).then((res) => {
      if (res.meta.requestStatus === 'fulfilled') {
        navigate('/');
      }
    });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-tr from-slate-100 via-slate-50 to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-premium-lg p-8">
        
        {/* Portal Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-600 text-white shadow-premium mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Pharma CRM Portal
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
            Log in with your representative credentials
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Username Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Username
            </label>
            <input
              type="text"
              {...register('username', { required: 'Username is required' })}
              className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 focus:outline-none text-slate-800 dark:text-slate-100 ${
                errors.username ? 'border-rose-500 dark:border-rose-500 ring-1 ring-rose-500' : ''
              }`}
              placeholder="e.g. rep1"
            />
            {errors.username && (
              <span className="block text-xs text-rose-500 font-medium mt-1.5">
                {errors.username.message}
              </span>
            )}
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Password
            </label>
            <input
              type="password"
              {...register('password', { required: 'Password is required' })}
              className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 focus:outline-none text-slate-800 dark:text-slate-100 ${
                errors.password ? 'border-rose-500 dark:border-rose-500 ring-1 ring-rose-500' : ''
              }`}
              placeholder="••••••••"
            />
            {errors.password && (
              <span className="block text-xs text-rose-500 font-medium mt-1.5">
                {errors.password.message}
              </span>
            )}
          </div>

          {/* Helper credentials note */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800 text-xs text-slate-400 dark:text-slate-500 flex justify-between leading-relaxed">
            <span>Demo Login: <strong className="text-slate-600 dark:text-slate-400">rep1</strong></span>
            <span>Password: <strong className="text-slate-600 dark:text-slate-400">password123</strong></span>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2.5 w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-500 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-premium hover:shadow-premium-lg"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Sign In
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
