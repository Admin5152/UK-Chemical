import React from 'react';
import { useInventory } from '../context/InventoryContext';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import { FileText } from 'lucide-react';

export const Reports = () => {
  const { logs, products } = useInventory();

  // Chart Data: Stock Distribution by Category
  const categoryData = Object.values(products.reduce((acc: any, p) => {
    if (!acc[p.category]) acc[p.category] = { name: p.category, value: 0 };
    acc[p.category].value += (p.qtyWarehouse + p.qtyOffice);
    return acc;
  }, {}));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  return (
    <div className="space-y-6">
       <div>
          <h2 className="text-2xl font-bold text-slate-800">Reports & Logs</h2>
          <p className="text-slate-500">View system activity and inventory analytics.</p>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Log */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col h-[500px]">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
             <h3 className="font-bold text-slate-800 flex items-center gap-2">
               <FileText size={20} className="text-brand-500" /> Recent Activity
             </h3>
          </div>
          <div className="overflow-y-auto flex-1 p-4 space-y-4 custom-scrollbar">
            {logs.length === 0 ? (
               <p className="text-center text-slate-400 py-10">No activity recorded yet.</p>
            ) : (
              logs.map(log => (
                <div key={log.id} className="flex gap-3 text-sm border-l-2 border-slate-200 pl-3 pb-1">
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className={`font-bold text-xs px-2 py-0.5 rounded-full ${
                        log.action === 'ADD' ? 'bg-green-100 text-green-700' :
                        log.action === 'REMOVE' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>{log.action}</span>
                      <span className="text-xs text-slate-400">{new Date(log.date).toLocaleString()}</span>
                    </div>
                    <p className="mt-1 font-medium text-slate-700">{log.productName}</p>
                    <p className="text-slate-500 text-xs">{log.details}</p>
                    <p className="text-xs text-slate-400 mt-1">By: {log.performedBy}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Charts */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-[500px] flex flex-col">
            <h3 className="font-bold text-slate-800 mb-4">Stock Distribution by Category</h3>
            <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
