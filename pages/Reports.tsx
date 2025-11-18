import React from 'react';
import { useInventory } from '../context/InventoryContext';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { FileText, AlertTriangle, Calendar } from 'lucide-react';

export const Reports = () => {
  const { logs, products } = useInventory();

  // Chart Data: Stock Distribution by Category
  const categoryData = Object.values(products.reduce((acc: any, p) => {
    if (!acc[p.category]) acc[p.category] = { name: p.category, value: 0 };
    acc[p.category].value += (p.qtyWarehouse + p.qtyOffice);
    return acc;
  }, {}));

  // Expired Items Logic
  const now = new Date();
  const expiredProducts = products.filter(p => new Date(p.expirationDate) < now);
  
  const expiredCategoryData = Object.values(expiredProducts.reduce((acc: any, p) => {
    if (!acc[p.category]) acc[p.category] = { name: p.category, value: 0 };
    acc[p.category].value += 1;
    return acc;
  }, {}));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  const DANGER_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#b91c1c', '#991b1b'];

  return (
    <div className="space-y-8 pb-12">
       <div>
          <h2 className="text-2xl font-bold text-slate-800">Reports & Analytics</h2>
          <p className="text-slate-500">View system activity, stock distribution, and expiry analysis.</p>
        </div>

      {/* Expiry Analysis Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
         <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
               <AlertTriangle size={20} className="text-red-500" /> Expired Products Analysis
            </h3>
            <span className="text-xs font-medium bg-red-100 text-red-700 px-3 py-1 rounded-full">
              {expiredProducts.length} Items Expired
            </span>
         </div>
         <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Expired Category Chart */}
            <div className="h-64 w-full lg:col-span-1">
               <h4 className="text-sm font-semibold text-slate-600 mb-4 text-center">Expired Items by Category</h4>
               {expiredProducts.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expiredCategoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {expiredCategoryData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={DANGER_COLORS[index % DANGER_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
               ) : (
                 <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                   No expired items. Good job!
                 </div>
               )}
            </div>

            {/* Expired Items List */}
            <div className="lg:col-span-2 border border-slate-100 rounded-lg overflow-hidden">
               <div className="bg-slate-50 p-3 text-xs font-bold text-slate-500 uppercase tracking-wider flex justify-between">
                 <span>Product Name</span>
                 <span>Expired Date</span>
               </div>
               <div className="max-h-64 overflow-y-auto custom-scrollbar divide-y divide-slate-100">
                 {expiredProducts.length === 0 ? (
                   <p className="p-6 text-center text-slate-400 text-sm">No items are currently expired.</p>
                 ) : (
                   expiredProducts.map(p => (
                     <div key={p.id} className="p-3 flex justify-between items-center hover:bg-red-50/30 transition">
                       <div>
                         <p className="font-medium text-slate-800 text-sm">{p.name}</p>
                         <p className="text-xs text-slate-500">{p.category} | {p.qtyWarehouse + p.qtyOffice} {p.unit} remaining</p>
                       </div>
                       <div className="text-right">
                         <p className="text-xs font-bold text-red-600">{new Date(p.expirationDate).toLocaleDateString()}</p>
                         <p className="text-[10px] text-slate-400">
                           {Math.ceil((new Date().getTime() - new Date(p.expirationDate).getTime()) / (1000 * 3600 * 24))} days ago
                         </p>
                       </div>
                     </div>
                   ))
                 )}
               </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Log */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col h-[500px]">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
             <h3 className="font-bold text-slate-800 flex items-center gap-2">
               <FileText size={20} className="text-brand-500" /> Recent Activity Log
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

        {/* Stock Distribution Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-[500px] flex flex-col">
          <h3 className="font-bold text-slate-800 mb-4">Active Stock Distribution</h3>
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
  );
};
