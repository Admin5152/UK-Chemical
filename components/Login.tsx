import React from 'react';
import { useInventory } from '../context/InventoryContext';
import { Lock } from 'lucide-react';

export const Login = () => {
  const { login } = useInventory();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-600 to-slate-900 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock size={32} />
          </div>
          <h1 className="text-3xl font-bold text-slate-800">UK Chemicals</h1>
          <p className="text-slate-500">Inventory Management System</p>
        </div>

        <div className="space-y-4">
          <button 
            onClick={() => login('MANAGER')}
            className="w-full p-4 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition transform hover:scale-[1.02] shadow-lg"
          >
            Login as Manager
            <span className="block text-xs font-normal opacity-80 mt-1">Full Access (Edit, Settings, Users)</span>
          </button>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">OR</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          <button 
            onClick={() => login('STAFF')}
            className="w-full p-4 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition transform hover:scale-[1.02]"
          >
            Login as Staff
            <span className="block text-xs font-normal text-slate-400 mt-1">Limited Access (View, Move Stock)</span>
          </button>
        </div>

        <p className="text-center text-xs text-slate-400 mt-8">
          © {new Date().getFullYear()} UK Chemicals Ltd. Secure System.
        </p>
      </div>
    </div>
  );
};
