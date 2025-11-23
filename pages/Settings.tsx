
import React, { useState, useEffect, useRef } from 'react';
import { useInventory } from '../context/InventoryContext';
import { UserRole } from '../types';
import { Users, Shield, Calendar, Settings as SettingsIcon, Database, AlertTriangle, Check, Copy, Building, Save, Download, FileText, Printer } from 'lucide-react';

// Declare html2pdf for TypeScript
declare var html2pdf: any;

export const Settings = () => {
  const { users, currentUser, updateUserRole, expiryThreshold, setExpiryThreshold, dbHealth, companyInfo, updateCompanyInfo, products, suppliers, invoices } = useInventory();
  const [copied, setCopied] = useState(false);
  
  // Company Info State
  const [formData, setFormData] = useState(companyInfo);
  const [isSaving, setIsSaving] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setFormData(companyInfo);
  }, [companyInfo]);

  const handleRoleChange = (userId: string, newRole: string) => {
    if (userId === currentUser?.id) {
      alert("You cannot change your own role.");
      return;
    }
    updateUserRole(userId, newRole as UserRole);
  };

  const handleSaveCompanyInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await updateCompanyInfo(formData);
    setIsSaving(false);
    alert("Company details and settings updated successfully!");
  };

  const handleExportJSON = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      company: companyInfo,
      products,
      suppliers,
      invoices
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ukchem-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadReportPDF = () => {
    const element = reportRef.current;
    if (!element) return;

    const opt = {
      margin:       0, 
      filename:     `UKChem_System_Report_${new Date().toISOString().split('T')[0]}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    if (typeof html2pdf !== 'undefined') {
        html2pdf().set(opt).from(element).save();
    } else {
        alert("PDF generator library not loaded. Please refresh the page.");
    }
  };

  const INVOICE_SQL = `
-- 1. DROP TABLE to ensure clean slate
DROP TABLE IF EXISTS public.invoices;

-- 2. CREATE TABLE without strict Foreign Key to avoid conflicts
CREATE TABLE public.invoices (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  invoice_number text not null,
  customer_name text not null,
  customer_address text,
  customer_contact text,
  date date default CURRENT_DATE,
  items jsonb default '[]'::jsonb,
  total_amount numeric default 0,
  created_by uuid
);

-- 3. ENABLE RLS & PERMISSIONS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access" ON public.invoices FOR ALL USING (true);
GRANT ALL ON public.invoices TO anon, authenticated, service_role;
  `.trim();

  const handleCopySQL = () => {
    navigator.clipboard.writeText(INVOICE_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Settings & Administration</h2>
        <p className="text-slate-500">Manage users, roles, and system configurations.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* Left Column */}
        <div className="space-y-8">
          
          {/* Company Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center gap-2">
              <Building className="text-brand-600" size={20} />
              <h3 className="font-bold text-slate-800">Company Profile & Invoices</h3>
            </div>
            <div className="p-6">
              <form onSubmit={handleSaveCompanyInfo} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Company Name</label>
                    <input type="text" required className="w-full p-2 border border-slate-200 rounded-lg bg-white" 
                      value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tax ID / TIN</label>
                    <input type="text" className="w-full p-2 border border-slate-200 rounded-lg bg-white" 
                      value={formData.tin} onChange={e => setFormData({...formData, tin: e.target.value})} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Address</label>
                    <input type="text" required className="w-full p-2 border border-slate-200 rounded-lg bg-white" 
                      value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone</label>
                    <input type="text" required className="w-full p-2 border border-slate-200 rounded-lg bg-white" 
                      value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                    <input type="email" required className="w-full p-2 border border-slate-200 rounded-lg bg-white" 
                      value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 mt-4">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-2">
                    <FileText size={14} /> Invoice Terms & Conditions
                  </label>
                  <textarea 
                    className="w-full p-3 border border-slate-200 rounded-lg bg-white text-sm min-h-[100px]"
                    value={formData.terms || ''}
                    onChange={e => setFormData({...formData, terms: e.target.value})}
                    placeholder="Enter default terms and conditions..."
                  />
                  <p className="text-xs text-slate-400 mt-1">These terms will appear at the bottom of every generated invoice.</p>
                </div>

                <div className="flex justify-end pt-2">
                  <button type="submit" disabled={isSaving} className="bg-brand-600 text-white px-6 py-2 rounded-lg hover:bg-brand-700 transition shadow flex items-center gap-2 disabled:opacity-50">
                    <Save size={18} /> {isSaving ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* User Management */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center gap-2">
              <Users className="text-slate-600" size={20} />
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
                        className={`text-sm font-medium bg-white text-slate-900 border border-slate-200 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand-500 ${
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
            </div>
          </div>

        </div>

        {/* Right Column */}
        <div className="space-y-8">
          
          {/* System Configuration */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center gap-2">
              <SettingsIcon className="text-slate-600" size={20} />
              <h3 className="font-bold text-slate-800">System Configuration</h3>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <Calendar size={16} className="text-brand-600" />
                  Expiry Warning Threshold
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
                  <div className="w-24 border border-slate-300 rounded-md px-3 py-2 flex items-center justify-center font-bold text-slate-700 bg-white">
                      {expiryThreshold}d
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Products expiring within this period will be flagged.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <h4 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
                  <Database size={16} /> Data Management
                </h4>
                <div className="space-y-3">
                  <button 
                    onClick={handleDownloadReportPDF}
                    className="w-full py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 flex items-center justify-center gap-2 transition shadow-md"
                  >
                    <Printer size={16} /> Download Full Report (PDF)
                  </button>
                  <button 
                    onClick={handleExportJSON}
                    className="w-full py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 flex items-center justify-center gap-2 transition"
                  >
                    <Download size={16} /> Export Backup (JSON)
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-2 text-center">
                  Generate a PDF report using the invoice template, or download a JSON backup.
                </p>
              </div>
            </div>
          </div>

          {/* Database Diagnostics */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center gap-2">
              <Database className={!dbHealth.invoices ? "text-red-500" : "text-slate-600"} size={20} />
              <h3 className="font-bold text-slate-800">Database Diagnostics</h3>
            </div>
            <div className="p-6">
              {!dbHealth.invoices ? (
                <div className="space-y-4">
                  <div className="bg-red-50 border-l-4 border-red-500 p-4">
                    <h4 className="text-red-700 font-bold flex items-center gap-2">
                      <AlertTriangle size={18} /> Invoice Table Missing
                    </h4>
                    <p className="text-red-600 text-sm mt-1">
                      The 'invoices' table was not found or permissions are denied.
                    </p>
                  </div>
                  
                  <div className="bg-slate-900 rounded-lg p-4 relative group">
                    <pre className="text-xs text-green-400 font-mono overflow-x-auto whitespace-pre-wrap break-all">
                      {INVOICE_SQL}
                    </pre>
                    <button 
                      onClick={handleCopySQL}
                      className="absolute top-2 right-2 p-2 bg-slate-800 text-white rounded hover:bg-slate-700 transition text-xs flex items-center gap-1"
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      {copied ? 'Copied' : 'Copy SQL'}
                    </button>
                  </div>

                  <div className="text-xs text-slate-500">
                    <strong>How to Fix:</strong>
                    <ol className="list-decimal ml-4 mt-1 space-y-1">
                      <li>Copy the SQL code above.</li>
                      <li>Go to your <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-brand-600 underline">Supabase Dashboard</a>.</li>
                      <li>Open the <strong>SQL Editor</strong> tab.</li>
                      <li>Paste the code and click <strong>Run</strong>.</li>
                      <li><strong>Refresh this page</strong> to reconnect.</li>
                    </ol>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-green-600 bg-green-50 p-3 rounded-lg">
                  <Check size={20} />
                  <span className="font-medium text-sm">All Database Tables are Connected & Healthy</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* HIDDEN REPORT TEMPLATE (Used for PDF Generation) */}
      <div style={{ position: 'fixed', top: '-10000px', left: 0, width: '210mm' }}>
        <div ref={reportRef} className="bg-white p-12 text-slate-800" style={{ minHeight: '297mm' }}>
          {/* Header */}
          <div className="flex justify-between items-start border-b-4 border-brand-600 pb-6 mb-8">
            <div className="flex flex-col">
               <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-brand-600 text-white rounded-lg flex items-center justify-center">
                    <span className="font-bold text-2xl">UK</span>
                  </div>
                  <h1 className="text-3xl font-bold text-slate-800 tracking-tight">{companyInfo.name}</h1>
               </div>
               <div className="text-sm text-slate-500 space-y-0.5">
                 <p>{companyInfo.address}</p>
                 <p>{companyInfo.phone} | {companyInfo.email}</p>
                 <p>TIN: {companyInfo.tin}</p>
               </div>
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-light text-slate-400 uppercase tracking-widest">System Report</h2>
              <p className="text-sm font-bold text-slate-800 mt-2">{new Date().toLocaleDateString()}</p>
            </div>
          </div>

          {/* Section 1: Stock Overview */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-brand-700 uppercase mb-2 border-b border-slate-200 pb-1">1. Product Inventory</h3>
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-800 text-white">
                <tr>
                  <th className="p-2">Product Name</th>
                  <th className="p-2">Category</th>
                  <th className="p-2 text-center">Warehouse</th>
                  <th className="p-2 text-center">Office</th>
                  <th className="p-2 text-right">Total Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {products.map((p, i) => (
                  <tr key={i} className="odd:bg-white even:bg-slate-50">
                    <td className="p-2 font-medium">{p.name}</td>
                    <td className="p-2 text-slate-500">{p.category}</td>
                    <td className="p-2 text-center">{p.qtyWarehouse}</td>
                    <td className="p-2 text-center">{p.qtyOffice}</td>
                    <td className="p-2 text-right font-bold">
                      {((p.qtyWarehouse + p.qtyOffice) * p.price).toLocaleString('en-GH', { style: 'currency', currency: 'GHS' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Section 2: Suppliers */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-brand-700 uppercase mb-2 border-b border-slate-200 pb-1">2. Suppliers</h3>
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-800 text-white">
                <tr>
                  <th className="p-2">Company</th>
                  <th className="p-2">Contact Person</th>
                  <th className="p-2">Email</th>
                  <th className="p-2">Phone</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {suppliers.map((s, i) => (
                  <tr key={i} className="odd:bg-white even:bg-slate-50">
                    <td className="p-2 font-medium">{s.companyName}</td>
                    <td className="p-2">{s.contactName}</td>
                    <td className="p-2 text-slate-500">{s.email}</td>
                    <td className="p-2">{s.phone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Section 3: Invoices Summary */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-brand-700 uppercase mb-2 border-b border-slate-200 pb-1">3. Recent Invoices</h3>
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-800 text-white">
                <tr>
                  <th className="p-2">Invoice No</th>
                  <th className="p-2">Date</th>
                  <th className="p-2">Customer</th>
                  <th className="p-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {invoices.slice(0, 15).map((inv, i) => (
                  <tr key={i} className="odd:bg-white even:bg-slate-50">
                    <td className="p-2 font-medium">{inv.invoiceNumber}</td>
                    <td className="p-2">{new Date(inv.date).toLocaleDateString()}</td>
                    <td className="p-2">{inv.customerName}</td>
                    <td className="p-2 text-right font-bold">
                      {inv.totalAmount.toLocaleString('en-GH', { style: 'currency', currency: 'GHS' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {invoices.length > 15 && (
              <p className="text-xs text-center text-slate-400 mt-2">...and {invoices.length - 15} more invoices not shown.</p>
            )}
          </div>

          {/* Footer */}
          <div className="mt-auto pt-8 border-t border-slate-200 text-center text-xs text-slate-400">
             <p>Generated by UK Chemicals Inventory System</p>
             <p>{new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>

    </div>
  );
};
