import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Lock, Key, CheckCircle, AlertCircle, Eye, EyeOff, ArrowRight } from 'lucide-react';

export const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) throw updateError;

      setSuccess(true);
      
      // Redirect after 3 seconds
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
      
    } catch (err: any) {
      setError(err.message || 'Failed to update password. Link may be expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-600 to-slate-900 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Key size={32} />
          </div>
          <h1 className="text-3xl font-bold text-slate-800">UK Chemicals</h1>
          <p className="text-slate-500 font-medium">Reset Your Password</p>
        </div>

        {success ? (
          <div className="text-center animate-in fade-in zoom-in duration-500">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Success!</h2>
            <p className="text-green-700 font-semibold mb-6 flex items-center gap-2 justify-center">
              Password updated successfully!
            </p>
            <p className="text-slate-500 text-sm flex items-center justify-center gap-2">
              Redirecting to login in 3 seconds... <div className="w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
            </p>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 flex items-start gap-3 animate-shake">
                <AlertCircle size={20} className="shrink-0" />
                <p className="font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">New Password</label>
                <div className="relative">
                  <span className="absolute left-4 top-4 text-slate-400">
                    <Lock size={18} />
                  </span>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required 
                    minLength={8}
                    className="w-full pl-11 pr-12 p-4 border border-slate-200 bg-white text-slate-900 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition"
                    placeholder="Min. 8 characters"
                    value={password} 
                    onChange={e => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">Confirm New Password</label>
                <div className="relative">
                  <span className="absolute left-4 top-4 text-slate-400">
                    <Lock size={18} />
                  </span>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required 
                    className="w-full pl-11 p-4 border border-slate-200 bg-white text-slate-900 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition"
                    placeholder="Repeat password"
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full p-4 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition transform hover:scale-[1.02] active:scale-[0.98] shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </>
        )}

        <p className="text-center text-[10px] text-slate-300 mt-12 uppercase tracking-widest font-bold">
          © {new Date().getFullYear()} UK Chemicals Ltd. Secure Access.
        </p>
      </div>
    </div>
  );
};
