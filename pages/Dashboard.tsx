import React from 'react';
import { useInventory } from '../context/InventoryContext';
import { 
  TrendingDown, 
  AlertTriangle, 
  Package, 
  DollarSign, 
  ArrowRight 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';

export const Dashboard = ({ setView }: { setView: (v: string) => void }) => {
  const { products, notifications } = useInventory();

  const totalProducts = products.length;
  const totalValue = products.reduce((acc, p) => acc + ((p.qtyWarehouse + p.qtyOffice) * p.price), 0);
  const lowStockItems = products.filter(p => (p.qtyWarehouse + p.qtyOffice) <= p.reorderLevel).length;
  const expiredItems = products.filter(p => new Date(p.expirationDate) < new Date()).length;

  const data = products.slice(0, 5).map(p => ({
    name: p.name.split(' ')[0], // Short name for chart
    Stock: p.qtyWarehouse + p.qtyOffice,
    Reorder: p.reorderLevel
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Dashboard Overview</h2>
          <p className="text-slate-500">Welcome back! Here's what's happening today.</p>
        </div>
        <button 
          onClick={() => setView('inventory')}
          className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition shadow-sm flex items-center gap-2"
        >
          Manage Inventory <ArrowRight size={16} />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between">
          <div>
            <p className="text-slate-500 text-sm font-medium">Total Products</p>
            <h3 className="text-3xl font-bold text-slate-800 mt-2">{totalProducts}</h3>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Package size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between">
          <div>
            <p className="text-slate-500 text-sm font-medium">Inventory Value</p>
            <h3 className="text-3xl font-bold text-slate-800 mt-2">${totalValue.toLocaleString()}</h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between">
          <div>
            <p className="text-slate-500 text-sm font-medium">Low Stock Alerts</p>
            <h3 className="text-3xl font-bold text-orange-600 mt-2">{lowStockItems}</h3>
            <p className="text-xs text-slate-400 mt-1">Needs Reorder</p>
          </div>
          <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
            <TrendingDown size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between">
          <div>
            <p className="text-slate-500 text-sm font-medium">Expired / Soon</p>
            <h3 className="text-3xl font-bold text-red-600 mt-2">{expiredItems}</h3>
            <p className="text-xs text-slate-400 mt-1">Action Required</p>
          </div>
          <div className="p-3 bg-red-50 text-red-600 rounded-lg">
            <AlertTriangle size={24} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Alerts */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 lg:col-span-1">
          <h3 className="font-bold text-slate-800 mb-4">Recent Notifications</h3>
          <div className="space-y-3">
            {notifications.slice(0, 5).map(notif => (
              <div key={notif.id} className={`p-3 rounded-lg border-l-4 ${
                notif.type === 'DANGER' ? 'border-red-500 bg-red-50' : 
                notif.type === 'WARNING' ? 'border-orange-500 bg-orange-50' : 'border-blue-500 bg-blue-50'
              }`}>
                <div className="flex justify-between items-start">
                  <h4 className={`text-sm font-semibold ${
                    notif.type === 'DANGER' ? 'text-red-700' : 
                    notif.type === 'WARNING' ? 'text-orange-700' : 'text-blue-700'
                  }`}>{notif.title}</h4>
                  <span className="text-[10px] text-slate-500">{new Date(notif.date).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-slate-600 mt-1">{notif.message}</p>
              </div>
            ))}
            {notifications.length === 0 && (
              <p className="text-slate-400 text-sm text-center py-4">No new notifications</p>
            )}
          </div>
        </div>

        {/* Stock Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 lg:col-span-2">
          <h3 className="font-bold text-slate-800 mb-4">Top 5 Products Stock vs Reorder Level</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="Stock" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                <Bar dataKey="Reorder" fill="#f97316" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
