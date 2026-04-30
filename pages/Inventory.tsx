import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Product, FilterState, Location } from '../types';
import { CATEGORIES } from '../constants';
import { 
  Search, Filter, Plus, AlertCircle, MoreHorizontal, ArrowRightLeft, 
  Trash2, Edit, CheckCircle, Clock 
} from 'lucide-react';

export const Inventory = () => {
  const { products, deleteProduct, currentUser, adjustStock, transferStock, addProduct, updateProduct, createApprovalRequest, isActionUnlocked } = useInventory();
  
  const [filter, setFilter] = useState<FilterState>({
    search: '',
    category: 'ALL',
    location: 'ALL',
    stockStatus: 'ALL'
  });

  // Modal States
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [selectedProductForAction, setSelectedProductForAction] = useState<Product | null>(null);

  // Confirmation/Approval Modals
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; type: 'edit' | 'delete'; product: Product | null }>({
    isOpen: false,
    type: 'edit',
    product: null
  });
  const [approvalSentModal, setApprovalSentModal] = useState<{ isOpen: boolean; productName: string }>({
    isOpen: false,
    productName: ''
  });
  
  // Filter Logic
  const filteredProducts = products.filter(p => {
    const totalStock = p.qtyWarehouse + p.qtyOffice;
    const isLow = totalStock <= p.reorderLevel;
    const isExpired = new Date(p.expirationDate) < new Date();
    
    const matchesSearch = p.name.toLowerCase().includes(filter.search.toLowerCase()) || 
                          p.supplier.toLowerCase().includes(filter.search.toLowerCase());
    const matchesCategory = filter.category === 'ALL' || p.category === filter.category;
    const matchesLocation = filter.location === 'ALL' || (filter.location === 'Warehouse' ? p.qtyWarehouse > 0 : p.qtyOffice > 0);
    
    let matchesStatus = true;
    if (filter.stockStatus === 'LOW') matchesStatus = isLow;
    if (filter.stockStatus === 'EXPIRED') matchesStatus = isExpired;
    if (filter.stockStatus === 'NORMAL') matchesStatus = !isLow && !isExpired;

    return matchesSearch && matchesCategory && matchesLocation && matchesStatus;
  });

  // Helper to check status
  const getStatusBadge = (p: Product) => {
    const total = p.qtyWarehouse + p.qtyOffice;
    const isExpired = new Date(p.expirationDate) < new Date();
    const isLow = total <= p.reorderLevel;

    if (isExpired) return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium flex items-center gap-1 w-fit"><AlertCircle size={12} /> Expired</span>;
    if (isLow) return <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full font-medium flex items-center gap-1 w-fit"><AlertCircle size={12} /> Low Stock</span>;
    return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full font-medium flex items-center gap-1 w-fit"><CheckCircle size={12} /> Good</span>;
  };

  // --- Modals (Simplified inline for XML constraints, ideally separate components) ---

  const handleEditClick = (p: Product) => {
    if (currentUser?.role?.toUpperCase() === 'MANAGER') {
      setConfirmModal({ isOpen: true, type: 'edit', product: p });
    } else {
      // Check if unlocked
      if (isActionUnlocked('edit', p.id)) {
        setEditingProduct(p);
        setIsProductModalOpen(true);
      } else {
        // Request approval
        createApprovalRequest('edit', p.id, p.name).then(success => {
          if (success) setApprovalSentModal({ isOpen: true, productName: p.name });
        });
      }
    }
  };

  const handleDeleteClick = (p: Product) => {
    if (currentUser?.role?.toUpperCase() === 'MANAGER') {
      setConfirmModal({ isOpen: true, type: 'delete', product: p });
    } else {
      // Check if unlocked
      if (isActionUnlocked('delete', p.id)) {
        if (window.confirm(`Are you sure you want to delete ${p.name}?`)) {
          deleteProduct(p.id);
        }
      } else {
        // Request approval
        createApprovalRequest('delete', p.id, p.name).then(success => {
          if (success) setApprovalSentModal({ isOpen: true, productName: p.name });
        });
      }
    }
  };

  const handleConfirmAction = () => {
    if (!confirmModal.product) return;
    
    if (confirmModal.type === 'edit') {
      setEditingProduct(confirmModal.product);
      setIsProductModalOpen(true);
    } else {
      deleteProduct(confirmModal.product.id);
    }
    setConfirmModal({ ...confirmModal, isOpen: false });
  };

  const handleTransferClick = (p: Product) => {
    setSelectedProductForAction(p);
    setIsTransferOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Inventory Management</h2>
          <p className="text-slate-500">Manage chemical stock across Warehouse and Office.</p>
        </div>
        
        {currentUser && (
          <button 
            onClick={() => { setEditingProduct(null); setIsProductModalOpen(true); }}
            className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition shadow flex items-center gap-2"
          >
            <Plus size={18} /> Add Product
          </button>
        )}
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search products..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-200 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            value={filter.search}
            onChange={(e) => setFilter({...filter, search: e.target.value})}
          />
        </div>
        <div className="relative">
          <select 
            className="w-full px-4 py-2 border border-slate-200 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none"
            value={filter.category}
            onChange={(e) => setFilter({...filter, category: e.target.value})}
          >
            <option value="ALL">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <Filter className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" size={16} />
        </div>
        <div className="relative">
          <select 
            className="w-full px-4 py-2 border border-slate-200 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none"
            value={filter.stockStatus}
            onChange={(e) => setFilter({...filter, stockStatus: e.target.value as any})}
          >
            <option value="ALL">All Statuses</option>
            <option value="LOW">Low Stock</option>
            <option value="EXPIRED">Expired</option>
            <option value="NORMAL">Good Stock</option>
          </select>
        </div>
         <div className="relative">
          <select 
            className="w-full px-4 py-2 border border-slate-200 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none"
            value={filter.location}
            onChange={(e) => setFilter({...filter, location: e.target.value as any})}
          >
            <option value="ALL">All Locations</option>
            <option value="Warehouse">Warehouse Only</option>
            <option value="Main Office">Main Office Only</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="p-4 font-semibold text-slate-600">Product Details</th>
                <th className="p-4 font-semibold text-slate-600">Category</th>
                <th className="p-4 font-semibold text-slate-600 text-center">Total Stock</th>
                <th className="p-4 font-semibold text-slate-600 text-center">Location Split</th>
                <th className="p-4 font-semibold text-slate-600">Expiry</th>
                <th className="p-4 font-semibold text-slate-600">Status</th>
                <th className="p-4 font-semibold text-slate-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredProducts.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="p-4">
                    <div className="font-medium text-slate-800">{p.name}</div>
                    <div className="text-xs text-slate-400">Supplier: {p.supplier}</div>
                  </td>
                  <td className="p-4 text-slate-600">{p.category}</td>
                  <td className="p-4 text-center">
                    <div className="font-bold text-slate-800">{p.qtyWarehouse + p.qtyOffice}</div>
                    <div className="text-xs text-slate-400">{p.unit}</div>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex flex-col gap-1 text-xs">
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">WH: {p.qtyWarehouse}</span>
                      <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded">Off: {p.qtyOffice}</span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-600">
                     <div>{new Date(p.expirationDate).toLocaleDateString()}</div>
                  </td>
                  <td className="p-4">
                    {getStatusBadge(p)}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => {
                          if (currentUser?.role?.toUpperCase() === 'MANAGER') {
                            handleTransferClick(p);
                          } else {
                            alert("⛔ Access Denied: Only managers can reorder or transfer stock.");
                          }
                        }} 
                        className={`p-2 rounded-full transition ${currentUser?.role?.toUpperCase() === 'MANAGER' ? 'text-slate-400 hover:text-brand-600 hover:bg-brand-50' : 'text-slate-200 cursor-not-allowed'}`}
                        title={currentUser?.role?.toUpperCase() === 'MANAGER' ? "Transfer Stock" : "Manager permission required to perform this action."}
                      >
                        <ArrowRightLeft size={16} />
                      </button>
                      
                      <button 
                        onClick={() => {
                          handleEditClick(p);
                        }} 
                        className={`p-2 rounded-full transition ${currentUser?.role?.toUpperCase() === 'MANAGER' || isActionUnlocked('edit', p.id) ? 'text-slate-400 hover:text-blue-600 hover:bg-blue-50' : 'text-slate-300 hover:text-amber-600 hover:bg-amber-50'}`}
                        title={currentUser?.role?.toUpperCase() === 'MANAGER' ? "Edit" : (isActionUnlocked('edit', p.id) ? "Action Unlocked" : "Request Management Approval")}
                      >
                        <Edit size={16} />
                      </button>
                      
                      <button 
                        onClick={() => {
                          handleDeleteClick(p);
                        }} 
                        className={`p-2 rounded-full transition ${currentUser?.role?.toUpperCase() === 'MANAGER' || isActionUnlocked('delete', p.id) ? 'text-slate-400 hover:text-red-600 hover:bg-red-50' : 'text-slate-300 hover:text-amber-600 hover:bg-amber-50'}`}
                        title={currentUser?.role?.toUpperCase() === 'MANAGER' ? "Delete" : (isActionUnlocked('delete', p.id) ? "Action Unlocked" : "Request Management Approval")}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No products found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {isProductModalOpen && currentUser && (
        <ProductFormModal 
          isOpen={isProductModalOpen} 
          onClose={() => setIsProductModalOpen(false)} 
          existingProduct={editingProduct}
          onSubmit={editingProduct ? updateProduct : addProduct}
          isReadOnly={currentUser.role?.toUpperCase() !== 'MANAGER'}
        />
      )}

      {isTransferOpen && selectedProductForAction && (
        <TransferModal 
          isOpen={isTransferOpen} 
          onClose={() => setIsTransferOpen(false)}
          product={selectedProductForAction}
          onTransfer={transferStock}
        />
      )}

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              {confirmModal.type === 'edit' ? 'Confirm Edit' : 'Confirm Delete'}
            </h3>
            <p className="text-slate-600 mb-6">
              {confirmModal.type === 'edit' 
                ? `You are about to edit ${confirmModal.product?.name}. Please confirm you want to make changes.`
                : `Are you sure you want to delete ${confirmModal.product?.name}? This action cannot be undone.`
              }
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmAction}
                className={`px-4 py-2 text-white rounded-lg transition ${confirmModal.type === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-brand-600 hover:bg-brand-700'}`}
              >
                {confirmModal.type === 'edit' ? 'Yes, Edit' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approval Sent Modal */}
      {approvalSentModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-md p-8 text-center shadow-2xl">
            <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Request Sent</h3>
            <p className="text-slate-600 mb-6">
              Your manager has been notified and must approve the <strong>{confirmModal.type || 'action'}</strong> for <strong>{approvalSentModal.productName}</strong> before it proceeds.
            </p>
            <button 
              onClick={() => setApprovalSentModal({ isOpen: false, productName: '' })}
              className="w-full px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition font-bold"
            >
              Understand
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Sub-Components for Inventory Page ---

const ProductFormModal = ({ isOpen, onClose, existingProduct, onSubmit, isReadOnly }: any) => {
  const { isActionUnlocked, currentUser } = useInventory();
  if (!isOpen) return null;

  const effectiveReadOnly = isReadOnly && existingProduct && !isActionUnlocked('edit', existingProduct.id);

  const [formData, setFormData] = useState<Partial<Product>>(existingProduct || {
    name: '', category: 'Acids', unit: 'Liters', qtyWarehouse: 0, qtyOffice: 0,
    reorderLevel: 10, productionDate: '', expirationDate: '', origin: '',
    deliveryAgent: '', price: 0, supplier: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (effectiveReadOnly) {
       alert("⛔ Access Denied: Only managers can edit records.");
       return;
    }
    const product = {
      ...formData,
      id: existingProduct?.id || Math.random().toString(36).substr(2, 9),
      // Ensure numbers are numbers
      qtyWarehouse: Number(formData.qtyWarehouse),
      qtyOffice: Number(formData.qtyOffice),
      reorderLevel: Number(formData.reorderLevel),
      price: Number(formData.price)
    } as Product;
    onSubmit(product);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <h3 className="text-xl font-bold text-slate-800">{existingProduct ? 'View/Edit Product' : 'Add New Product'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {effectiveReadOnly && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg text-sm mb-4">
              Manager permission required to edit existing records.
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Product Name</label>
              <input readOnly={effectiveReadOnly} required type="text" className={`w-full p-2 border border-slate-300 bg-white text-slate-900 rounded-md ${effectiveReadOnly ? 'bg-slate-50 text-slate-500' : ''}`} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <select disabled={effectiveReadOnly} className={`w-full p-2 border border-slate-300 bg-white text-slate-900 rounded-md ${effectiveReadOnly ? 'bg-slate-50 text-slate-500' : ''}`} value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Supplier</label>
              <input readOnly={effectiveReadOnly} required type="text" className={`w-full p-2 border border-slate-300 bg-white text-slate-900 rounded-md ${effectiveReadOnly ? 'bg-slate-50 text-slate-500' : ''}`} value={formData.supplier} onChange={e => setFormData({...formData, supplier: e.target.value})} />
            </div>
             <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Unit (L, kg, etc)</label>
              <input readOnly={effectiveReadOnly} required type="text" className={`w-full p-2 border border-slate-300 bg-white text-slate-900 rounded-md ${effectiveReadOnly ? 'bg-slate-50 text-slate-500' : ''}`} value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Initial Qty (Warehouse)</label>
              <input readOnly={effectiveReadOnly} required type="number" className={`w-full p-2 border border-slate-300 bg-white text-slate-900 rounded-md ${effectiveReadOnly ? 'bg-slate-50 text-slate-500' : ''}`} value={formData.qtyWarehouse} onChange={e => setFormData({...formData, qtyWarehouse: Number(e.target.value)})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Initial Qty (Office)</label>
              <input readOnly={effectiveReadOnly} required type="number" className={`w-full p-2 border border-slate-300 bg-white text-slate-900 rounded-md ${effectiveReadOnly ? 'bg-slate-50 text-slate-500' : ''}`} value={formData.qtyOffice} onChange={e => setFormData({...formData, qtyOffice: Number(e.target.value)})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 text-orange-600">Reorder Threshold</label>
              <input readOnly={effectiveReadOnly} required type="number" className={`w-full p-2 border border-orange-200 bg-white text-slate-900 rounded-md focus:ring-orange-500 ${effectiveReadOnly ? 'bg-slate-50 text-slate-500' : ''}`} value={formData.reorderLevel} onChange={e => setFormData({...formData, reorderLevel: Number(e.target.value)})} />
            </div>
            <div>
              {/* Changed currency symbol to ₵ */}
              <label className="block text-sm font-medium text-slate-700 mb-1">Price per Unit (₵)</label>
              <input readOnly={effectiveReadOnly} required type="number" step="0.01" className={`w-full p-2 border border-slate-300 bg-white text-slate-900 rounded-md ${effectiveReadOnly ? 'bg-slate-50 text-slate-500' : ''}`} value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Production Date</label>
              <input readOnly={effectiveReadOnly} required type="date" className={`w-full p-2 border border-slate-300 bg-white text-slate-900 rounded-md ${effectiveReadOnly ? 'bg-slate-50 text-slate-500' : ''}`} value={formData.productionDate} onChange={e => setFormData({...formData, productionDate: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Expiration Date</label>
              <input readOnly={effectiveReadOnly} required type="date" className={`w-full p-2 border border-slate-300 bg-white text-slate-900 rounded-md ${effectiveReadOnly ? 'bg-slate-50 text-slate-500' : ''}`} value={formData.expirationDate} onChange={e => setFormData({...formData, expirationDate: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Origin Country</label>
              <input readOnly={effectiveReadOnly} type="text" className={`w-full p-2 border border-slate-300 bg-white text-slate-900 rounded-md ${effectiveReadOnly ? 'bg-slate-50 text-slate-500' : ''}`} value={formData.origin} onChange={e => setFormData({...formData, origin: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Delivery Agent</label>
              <input readOnly={effectiveReadOnly} type="text" className={`w-full p-2 border border-slate-300 bg-white text-slate-900 rounded-md ${effectiveReadOnly ? 'bg-slate-50 text-slate-500' : ''}`} value={formData.deliveryAgent} onChange={e => setFormData({...formData, deliveryAgent: e.target.value})} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
            {(!effectiveReadOnly || !existingProduct) && (
              <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700">Save Product</button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

const TransferModal = ({ isOpen, onClose, product, onTransfer }: any) => {
  const [from, setFrom] = useState<Location>('Warehouse');
  const [amount, setAmount] = useState(0);
  
  const to = from === 'Warehouse' ? 'Main Office' : 'Warehouse';
  const maxAvailable = from === 'Warehouse' ? product.qtyWarehouse : product.qtyOffice;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount > 0 && amount <= maxAvailable) {
      onTransfer(product.id, from, to, Number(amount));
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md">
        <div className="p-6 border-b">
          <h3 className="text-xl font-bold text-slate-800">Transfer Stock</h3>
          <p className="text-sm text-slate-500">{product.name}</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
            <div className="text-center flex-1">
              <div className="text-xs font-bold text-slate-500 uppercase">From</div>
              <div className="text-brand-700 font-bold">{from}</div>
              <div className="text-xs text-slate-400">Avail: {maxAvailable}</div>
            </div>
            <button type="button" onClick={() => setFrom(to)} className="p-2 bg-white shadow rounded-full text-slate-400 hover:text-brand-600">
              <ArrowRightLeft size={16} />
            </button>
            <div className="text-center flex-1">
              <div className="text-xs font-bold text-slate-500 uppercase">To</div>
              <div className="text-brand-700 font-bold">{to}</div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Amount to Transfer ({product.unit})</label>
            <input 
              type="number" max={maxAvailable} min={1} required 
              className="w-full p-2 border border-slate-300 bg-white text-slate-900 rounded-md text-lg font-bold text-center"
              value={amount} onChange={e => setAmount(Number(e.target.value))}
            />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700">Confirm Transfer</button>
          </div>
        </form>
      </div>
    </div>
  );
};