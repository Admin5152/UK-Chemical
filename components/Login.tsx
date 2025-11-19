import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Lock, UserPlus, LogIn, CheckCircle, Eye, EyeOff } from 'lucide-react';

export const Login = () => {
  const { login, signup } = useInventory();
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isSignup) {
        await signup(email, password, name);
        setSuccessMsg("Account created successfully! Please check your email to confirm your account before logging in.");
        setIsSignup(false);
        setPassword(''); // Clear password for safety
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      if (err.message.includes('Invalid login credentials')) {
        setError("Invalid email or password. If this is your first time, please create an account.");
      } else if (err.message.includes('Email not confirmed')) {
        setError("Please check your inbox and confirm your email address.");
      } else {
        setError(err.message || "Authentication failed");
      }
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
          <p className="text-slate-500">{isSignup ? 'Create Account' : 'Inventory Management System'}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 text-center">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-100 text-center flex items-center gap-2 justify-center">
            <CheckCircle size={16} /> {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
             <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
              <input 
                type="text" required 
                className="w-full p-3 border border-slate-200 bg-white text-slate-900 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                placeholder="John Doe"
                value={name} onChange={e => setName(e.target.value)}
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address</label>
            <input 
              type="email" required 
              className="w-full p-3 border border-slate-200 bg-white text-slate-900 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
              placeholder="email@ukchem.com"
              value={email} onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                required minLength={6}
                className="w-full p-3 border border-slate-200 bg-white text-slate-900 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none pr-10"
                placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full p-4 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition transform hover:scale-[1.02] shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Processing...' : isSignup ? <><UserPlus size={18} /> Create Account</> : <><LogIn size={18} /> Login</>}
          </button>
        </form>

        <div className="mt-6 text-center">
           <button 
             onClick={() => { setIsSignup(!isSignup); setError(''); setSuccessMsg(''); }}
             className="text-sm text-slate-400 hover:text-brand-600 underline transition"
           >
             {isSignup ? 'Already have an account? Login' : 'New staff member? Create account'}
           </button>
        </div>

        <p className="text-center text-xs text-slate-400 mt-8">
          © {new Date().getFullYear()} UK Chemicals Ltd. Secure System.
        </p>
      </div>
    </div>
  );
};