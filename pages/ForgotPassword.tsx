import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Lock, ArrowLeft, Mail, CheckCircle, AlertCircle } from 'lucide-react';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://ukchemical3.vercel.app/reset-password',
      });

      if (resetError) {
        if (resetError.message.includes('User not found')) {
          throw new Error('No account found with that email address.');
        }
        throw resetError;
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-600 to-slate-900 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock size={32} />
          </div>
          <h1 className="text-3xl font-bold text-slate-800">UK Chemicals</h1>
          <p className="text-slate-500 font-medium">Forgot Password</p>
        </div>

        {success ? (
          <div className="text-center animate-in fade-in duration-500">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Check Your Email</h2>
            <p className="text-slate-600 mb-6 font-medium leading-relaxed">
              Password reset link sent! Check your email inbox.
            </p>
            <a 
              href="/"
              className="inline-flex items-center gap-2 text-brand-600 hover:text-brand-700 font-bold transition"
            >
              <ArrowLeft size={18} /> Back to Login
            </a>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 flex items-start gap-3 animate-shake">
                <AlertCircle size={20} className="shrink-0" />
                <p className="font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">Email Address</label>
                <div className="relative">
                  <span className="absolute left-4 top-4 text-slate-400">
                    <Mail size={18} />
                  </span>
                  <input 
                    type="email" 
                    required 
                    className="w-full pl-11 p-4 border border-slate-200 bg-white text-slate-900 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition"
                    placeholder="email@ukchem.com"
                    value={email} 
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full p-4 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition transform hover:scale-[1.02] active:scale-[0.98] shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : 'Send Reset Link'}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <a 
                href="/"
                className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-brand-600 font-medium transition"
              >
                <ArrowLeft size={16} /> Back to Login
              </a>
            </div>
          </>
        )}

        <p className="text-center text-[10px] text-slate-300 mt-12 uppercase tracking-widest font-bold">
          © {new Date().getFullYear()} UK Chemicals Ltd. Secure Access.
        </p>
      </div>
    </div>
  );
};
