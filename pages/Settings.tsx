import React from 'react';
import { useInventory } from '../context/InventoryContext';
import { UserRole } from '../types';
import { Users, Shield, Calendar, Settings as SettingsIcon } from 'lucide-react';

export const Settings = () => {
  const { users, currentUser, updateUserRole, expiryThreshold, setExpiryThreshold } = useInventory();

  const handleRoleChange = (userId: string, newRole: string) => {
    if (userId === currentUser?.id) {
      alert("You cannot change your own role.");
      return;
    }
    updateUserRole(userId, newRole as UserRole);
  };

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Settings & Administration</h2>
        <p className="text-slate-500">Manage users, roles, and system configurations.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* User Management Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center gap-2">
            <Users className="text-brand-600" size={20} />
            <h3 className="font-bold text-slate-800">Team Management</h3>
          </div>
          <div className="p-6">
            <p className="text-sm text-slate-500 mb-4">Assign roles to control access levels within the system.</p>
            <div className="space-y-4">
              {users.map(user => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield size={16} className={user.role === 'MANAGER' ? 'text-brand-600' : 'text-slate-400'} />
                    <select 
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      disabled={user.id === currentUser?.id}
                      className={`text-sm font-medium bg-white border border-slate-200 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                        user.id === currentUser?.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-brand-300'
                      }`}
                    >
                      <option value="MANAGER">Manager</option>
                      <option value="STAFF">Staff</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 p-3 bg-blue-50 text-blue-700 text-xs rounded-md flex gap-2">
               <Shield size={16} />
               <span><strong>Note:</strong> Managers have full access to settings and inventory editing. Staff can only view inventory and move stock.</span>
            </div>
          </div>
        </div>

        {/* System Configuration Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
           <div className="p-6 border-b border-slate-100 flex items-center gap-2">
            <SettingsIcon className="text-slate-600" size={20} />
            <h3 className="font-bold text-slate-800">System Configuration</h3>
          </div>
          <div className="p-6 space-y-6">
             <div>
               <label className="block font-medium text-slate-700 mb-2 flex items-center gap-2">
                 <Calendar size={16} className="text-brand-600" />
                 Expiry Warning Threshold (Days)
               </label>
               <div className="flex items-center gap-4">
                 <input 
                    type="range" 
                    min="7" 
                    max="365" 
                    value={expiryThreshold} 
                    onChange={(e) => setExpiryThreshold(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
                 />
                 <div className="w-24 border border-slate-300 rounded-md px-3 py-2 flex items-center justify-center font-bold text-slate-700 bg-slate-50">
                    {expiryThreshold}d
                 </div>
               </div>
               <p className="text-xs text-slate-500 mt-2">
                 Products expiring within this many days will be flagged as "Expiring Soon" in Reports and trigger notifications.
               </p>
             </div>

             <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                <h4 className="font-semibold text-sm text-slate-700 mb-1">About Thresholds</h4>
                <p className="text-xs text-slate-500">
                  Changing the expiry threshold will immediately update the status of all products in the system. 
                  Low stock alerts are set individually per product in the inventory screen.
                </p>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};
