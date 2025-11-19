import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Supplier } from '../types';
import { 
  Search, Plus, Phone, Mail, Building, User, Edit, Trash2, Briefcase 
} from 'lucide-react';

export const Suppliers = () => {
  const { suppliers, currentUser, addSupplier, updateSupplier, deleteSupplier } = useInventory();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const filteredSuppliers = suppliers.filter(s => 
    s.companyName.toLowerCase().includes(search.toLowerCase()) ||
    s.contactName.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (s: Supplier) => {
    setEditingSupplier(s);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this supplier?')) {
      deleteSupplier(id);
    }
  };

  const openAddModal = () => {
    setEditingSupplier(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Supplier Management</h2>
          <p className="text-slate-500">Manage vendor contact details and company information.</p>
        </div>
        
        {currentUser?.role === 'MANAGER' && (
          <button 
            onClick={openAddModal}
            className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition shadow flex items-center gap-2"
          >
            <Plus size={18} /> Add Supplier
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search suppliers by company, name or email..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-200 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Suppliers Grid/Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSuppliers.map(supplier => (
          <div key={supplier.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition group">
            <div className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                   <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-bold text-xl">
                     {supplier.companyName.charAt(0)}
                   </div>
                   <div>
                     <h3 className="font-bold text-slate-800 text-lg leading-tight">{supplier.companyName}</h3>
                     <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                        <Briefcase size={10} /> Supplier ID: {supplier.id.slice(0,6)}
                     </p>
                   </div>
                </div>
                {currentUser?.role === 'MANAGER' && (
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(supplier)} className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition shadow-sm" title="Edit Supplier">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDelete(supplier.id)} className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-md transition shadow-sm" title="Delete Supplier">
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <User size={16} className="text-slate-400" />
                  <span className="font-medium">{supplier.contactName}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Mail size={16} className="text-slate-400" />
                  <a href={`mailto:${supplier.email}`} className="hover:text-brand-600 transition">{supplier.email}</a>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Phone size={16} className="text-slate-400" />
                  <span>{supplier.phone}</span>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 px-5 py-3 text-xs text-slate-400 border-t border-slate-100 flex justify-between items-center">
               <span>Authorized Vendor</span>
               <Building size={14} />
            </div>
          </div>
        ))}
        
        {filteredSuppliers.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
            <Building size={48} className="mx-auto mb-4 opacity-20" />
            <p>No suppliers found matching "{search}"</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <SupplierModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          existingSupplier={editingSupplier}
          onSubmit={editingSupplier ? updateSupplier : addSupplier}
        />
      )}
    </div>
  );
};

const SupplierModal = ({ isOpen, onClose, existingSupplier, onSubmit }: any) => {
  if (!isOpen) return null;

  const [formData, setFormData] = useState<Partial<Supplier>>(existingSupplier || {
    companyName: '', contactName: '', email: '', phone: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const supplier = {
      ...formData,
      id: existingSupplier?.id || Math.random().toString(36).substr(2, 9),
    } as Supplier;
    onSubmit(supplier);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl transform transition-all">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white rounded-t-xl">
          <h3 className="text-xl font-bold text-slate-800">{existingSupplier ? 'Edit Supplier' : 'Add New Supplier'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
            <div className="relative">
              <Building className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input required type="text" className="w-full pl-9 p-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" 
                value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} placeholder="e.g. BASF Chemical" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contact Person Name</label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input required type="text" className="w-full pl-9 p-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" 
                value={formData.contactName} onChange={e => setFormData({...formData, contactName: e.target.value})} placeholder="e.g. John Doe" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <div className="relative">
               <Mail className="absolute left-3 top-2.5 text-slate-400" size={16} />
               <input required type="email" className="w-full pl-9 p-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" 
                value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="john@company.com" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
            <div className="relative">
               <Phone className="absolute left-3 top-2.5 text-slate-400" size={16} />
               <input required type="tel" className="w-full pl-9 p-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" 
                value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+1 234 567 890" />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 shadow-lg shadow-brand-600/30 transition">
              {existingSupplier ? 'Update Details' : 'Save Supplier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};