import React, { useState, useRef, useEffect } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Invoice, InvoiceItem, Product } from '../types';
import { Plus, FileText, Printer, Trash2, Eye, ArrowLeft, Save, FlaskConical, Download, Search } from 'lucide-react';

// Declare html2pdf for TypeScript
declare var html2pdf: any;

// Helper to convert number to words (simplified English version)
const numberToWords = (num: number): string => {
  const a = ['','One ','Two ','Three ','Four ','Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
  const b = ['', '', 'Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];

  const numStr = num.toFixed(2);
  const [integerPart, decimalPart] = numStr.split('.');
  
  let n = parseInt(integerPart);
  if (n === 0) return 'Zero';
  
  const convertGroup = (n: number): string => {
    if (n === 0) return '';
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + ' ' + a[n % 10];
    if (n < 1000) return a[Math.floor(n / 100)] + 'Hundred ' + convertGroup(n % 100);
    return '';
  };

  let output = '';
  if (n >= 1000000) {
    output += convertGroup(Math.floor(n / 1000000)) + 'Million ';
    n %= 1000000;
  }
  if (n >= 1000) {
    output += convertGroup(Math.floor(n / 1000)) + 'Thousand ';
    n %= 1000;
  }
  output += convertGroup(n);
  
  return output.trim() + ' Cedis Only';
};

export const Invoices = () => {
  const { invoices, products, currentUser, addInvoice, deleteInvoice } = useInventory();
  const [viewState, setViewState] = useState<'LIST' | 'CREATE' | 'PREVIEW'>('LIST');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Create Form State
  const [formCustomer, setFormCustomer] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formContact, setFormContact] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formItems, setFormItems] = useState<InvoiceItem[]>([
    { id: '1', description: '', quantity: 1, rate: 0, amount: 0 }
  ]);

  // Autocomplete State
  const [activeSearchRow, setActiveSearchRow] = useState<string | null>(null);
  const searchWrapperRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target as Node)) {
        setActiveSearchRow(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Handlers ---

  const handleAddItem = () => {
    setFormItems([...formItems, { id: Math.random().toString(), description: '', quantity: 1, rate: 0, amount: 0 }]);
  };

  const handleRemoveItem = (id: string) => {
    setFormItems(formItems.filter(i => i.id !== id));
  };

  const handleItemChange = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setFormItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'rate') {
           updated.amount = Number(updated.quantity) * Number(updated.rate);
        }
        return updated;
      }
      return item;
    }));
  };

  const handleProductSelect = (itemId: string, product: Product) => {
    setFormItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          description: product.name,
          rate: product.price, // Auto-fill price
          amount: product.price * item.quantity
        };
      }
      return item;
    }));
    setActiveSearchRow(null);
  };

  const handleSave = async () => {
    const total = formItems.reduce((sum, item) => sum + item.amount, 0);
    const invoiceNumber = `INV-${new Date().getFullYear()}${Math.floor(1000 + Math.random() * 9000)}`;
    
    await addInvoice({
      invoiceNumber,
      customerName: formCustomer,
      customerAddress: formAddress,
      customerContact: formContact,
      date: formDate,
      items: formItems,
      totalAmount: total
    });

    setViewState('LIST');
    // Reset form
    setFormCustomer('');
    setFormAddress('');
    setFormContact('');
    setFormItems([{ id: '1', description: '', quantity: 1, rate: 0, amount: 0 }]);
  };

  const handleView = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setViewState('PREVIEW');
  };

  const handleDownloadPDF = () => {
    if (!selectedInvoice) return;
    
    const element = document.getElementById('invoice-content');
    const opt = {
      margin:       [5, 5, 5, 5], 
      filename:     `${selectedInvoice.invoiceNumber}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  };

  const handlePrint = () => {
    window.print();
  };

  // --- Renderers ---

  if (viewState === 'CREATE') {
    const total = formItems.reduce((sum, item) => sum + item.amount, 0);
    return (
      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        <div className="flex items-center justify-between">
          <button onClick={() => setViewState('LIST')} className="flex items-center text-slate-500 hover:text-slate-800">
            <ArrowLeft size={20} className="mr-2" /> Back to List
          </button>
          <h2 className="text-2xl font-bold text-slate-800">Create New Invoice</h2>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 space-y-6">
          {/* Header Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Bill To (Customer)</label>
              <input type="text" className="w-full p-2 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-brand-500 outline-none" placeholder="Company Name" value={formCustomer} onChange={e => setFormCustomer(e.target.value)} />
            </div>
             <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Invoice Date</label>
              <input type="date" className="w-full p-2 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-brand-500 outline-none" value={formDate} onChange={e => setFormDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Customer Address</label>
              <input type="text" className="w-full p-2 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-brand-500 outline-none" placeholder="City, Region" value={formAddress} onChange={e => setFormAddress(e.target.value)} />
            </div>
             <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Contact No.</label>
              <input type="text" className="w-full p-2 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-brand-500 outline-none" placeholder="Phone Number" value={formContact} onChange={e => setFormContact(e.target.value)} />
            </div>
          </div>

          {/* Line Items */}
          <div ref={searchWrapperRef}>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Items</label>
            <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-visible">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-100 text-slate-600 font-semibold">
                  <tr>
                    <th className="p-3">Description / Product</th>
                    <th className="p-3 w-24 text-center">Qty</th>
                    <th className="p-3 w-32 text-right">Rate</th>
                    <th className="p-3 w-32 text-right">Amount</th>
                    <th className="p-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {formItems.map((item) => (
                    <tr key={item.id} className="relative">
                      <td className="p-2 relative">
                        <input 
                          type="text" 
                          className="w-full p-2 bg-white border border-slate-200 rounded outline-none focus:border-brand-500" 
                          placeholder="Search Product..." 
                          value={item.description} 
                          onChange={e => handleItemChange(item.id, 'description', e.target.value)}
                          onFocus={() => setActiveSearchRow(item.id)}
                        />
                        {/* Autocomplete Dropdown */}
                        {activeSearchRow === item.id && (
                          <div className="absolute left-2 right-2 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto custom-scrollbar">
                            {products.filter(p => p.name.toLowerCase().includes(item.description.toLowerCase())).map(p => (
                              <div 
                                key={p.id}
                                className="p-2 hover:bg-brand-50 cursor-pointer flex justify-between items-center"
                                onClick={() => handleProductSelect(item.id, p)}
                              >
                                <div>
                                  <p className="font-medium text-slate-800">{p.name}</p>
                                  <p className="text-xs text-slate-500">Stock: {p.qtyWarehouse + p.qtyOffice} {p.unit}</p>
                                </div>
                                <span className="text-xs font-bold text-brand-600">GHS {p.price}</span>
                              </div>
                            ))}
                            {products.filter(p => p.name.toLowerCase().includes(item.description.toLowerCase())).length === 0 && (
                               <div className="p-2 text-slate-400 text-xs text-center">No products found</div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="p-2">
                        <input type="number" className="w-full p-2 bg-white border border-slate-200 rounded text-center outline-none focus:border-brand-500" value={item.quantity} onChange={e => handleItemChange(item.id, 'quantity', Number(e.target.value))} />
                      </td>
                      <td className="p-2">
                        <input type="number" className="w-full p-2 bg-white border border-slate-200 rounded text-right outline-none focus:border-brand-500" value={item.rate} onChange={e => handleItemChange(item.id, 'rate', Number(e.target.value))} />
                      </td>
                      <td className="p-2 text-right font-medium">
                        {item.amount.toLocaleString('en-GH', { style: 'currency', currency: 'GHS' })}
                      </td>
                      <td className="p-2 text-center">
                        {formItems.length > 1 && (
                          <button onClick={() => handleRemoveItem(item.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={handleAddItem} className="mt-3 text-sm text-brand-600 font-medium hover:underline flex items-center gap-1">
              <Plus size={16} /> Add Line Item
            </button>
          </div>

          <div className="flex justify-end border-t pt-4">
             <div className="text-right">
               <p className="text-slate-500 text-sm">Grand Total</p>
               <h3 className="text-2xl font-bold text-brand-700">{total.toLocaleString('en-GH', { style: 'currency', currency: 'GHS' })}</h3>
             </div>
          </div>

          <div className="flex justify-end gap-3">
            <button onClick={() => setViewState('LIST')} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
            <button onClick={handleSave} disabled={!formCustomer || total === 0} className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 shadow-md flex items-center gap-2 disabled:opacity-50">
              <Save size={18} /> Save Invoice
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (viewState === 'PREVIEW' && selectedInvoice) {
    return (
      <div className="max-w-4xl mx-auto pb-12">
        <style>
          {`
            @media print {
              body * {
                visibility: hidden;
              }
              #invoice-content, #invoice-content * {
                visibility: visible;
              }
              #invoice-content {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                margin: 0;
                padding: 0;
                box-shadow: none;
              }
              /* Hide navigation and buttons during print */
              .no-print, button, nav, header {
                display: none !important;
              }
            }
          `}
        </style>

        <div className="flex items-center justify-between mb-6 no-print">
          <button onClick={() => setViewState('LIST')} className="flex items-center text-slate-500 hover:text-slate-800">
            <ArrowLeft size={20} className="mr-2" /> Back to Invoices
          </button>
          <div className="flex gap-3">
            <button onClick={handlePrint} className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 flex items-center gap-2 shadow-lg transform hover:scale-105 transition">
               <Printer size={18} /> Print
            </button>
            <button onClick={handleDownloadPDF} className="px-4 py-2 bg-brand-700 text-white rounded-lg hover:bg-brand-800 flex items-center gap-2 shadow-lg transform hover:scale-105 transition">
              <Download size={18} /> Download PDF
            </button>
          </div>
        </div>

        {/* The Paper Invoice Render */}
        <div className="bg-white shadow-2xl mx-auto print:shadow-none" style={{ width: '210mm', minHeight: '297mm' }} id="invoice-content">
          <div className="p-12 h-full flex flex-col relative">
            
            {/* Header Section */}
            <div className="flex justify-between items-start border-b-4 border-brand-600 pb-6 mb-8">
              <div className="flex flex-col">
                 {/* Logo Area */}
                 <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-brand-600 text-white rounded-lg flex items-center justify-center">
                      <span className="font-bold text-2xl">UK</span>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">UK Chemicals</h1>
                 </div>
                 <div className="text-sm text-slate-500 space-y-0.5">
                   <p>Head Office, Kumasi, Ghana</p>
                   <p>+233 24 220 3228 | sagyeimenah@yahoo.com</p>
                   <p>TIN: C001234567</p>
                 </div>
              </div>
              <div className="text-right">
                <h2 className="text-5xl font-light text-slate-200 uppercase tracking-widest">Invoice</h2>
                <div className="mt-4 space-y-1">
                   <div className="flex justify-end items-center gap-4">
                     <span className="text-xs font-bold text-slate-400 uppercase">Invoice No</span>
                     <span className="font-bold text-lg text-slate-800">{selectedInvoice.invoiceNumber}</span>
                   </div>
                   <div className="flex justify-end items-center gap-4">
                     <span className="text-xs font-bold text-slate-400 uppercase">Date</span>
                     <span className="font-medium text-slate-800">{new Date(selectedInvoice.date).toLocaleDateString()}</span>
                   </div>
                </div>
              </div>
            </div>

            {/* Bill To Section */}
            <div className="mb-10 bg-slate-50 p-6 rounded-lg border border-slate-100 print:bg-transparent print:border-slate-300">
              <h3 className="text-xs font-bold text-brand-600 uppercase mb-2 tracking-wider">Bill To</h3>
              <p className="font-bold text-xl text-slate-900 mb-1">{selectedInvoice.customerName}</p>
              <p className="text-slate-600">{selectedInvoice.customerAddress}</p>
              <p className="text-slate-600">{selectedInvoice.customerContact}</p>
            </div>

            {/* Items Table */}
            <div className="flex-1">
              <table className="w-full mb-8">
                <thead className="bg-slate-800 text-white print:bg-slate-800 print:text-white">
                  <tr>
                    <th className="py-3 px-4 text-left w-16 rounded-tl-lg">#</th>
                    <th className="py-3 px-4 text-left">Product / Service</th>
                    <th className="py-3 px-4 text-center">Qty</th>
                    <th className="py-3 px-4 text-right">Rate</th>
                    <th className="py-3 px-4 text-right rounded-tr-lg">Amount</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {selectedInvoice.items.map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-100 odd:bg-white even:bg-slate-50/50 print:even:bg-slate-100">
                      <td className="py-4 px-4 text-slate-500">{idx + 1}</td>
                      <td className="py-4 px-4 font-medium text-slate-700">{item.description}</td>
                      <td className="py-4 px-4 text-center">{item.quantity}</td>
                      <td className="py-4 px-4 text-right">{item.rate.toLocaleString('en-GH', { minimumFractionDigits: 2 })}</td>
                      <td className="py-4 px-4 text-right font-bold text-slate-800">{item.amount.toLocaleString('en-GH', { style: 'currency', currency: 'GHS' })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Section */}
            <div className="flex flex-col items-end mb-16">
              <div className="w-2/5 space-y-3">
                 <div className="flex justify-between text-slate-600">
                   <span>Subtotal</span>
                   <span className="font-medium">{selectedInvoice.totalAmount.toLocaleString('en-GH', { style: 'currency', currency: 'GHS' })}</span>
                 </div>
                 <div className="flex justify-between text-slate-600">
                   <span>Tax (0%)</span>
                   <span className="font-medium">GHS 0.00</span>
                 </div>
                 <div className="flex justify-between py-4 border-t-2 border-slate-800">
                   <span className="font-bold text-xl text-brand-700">Grand Total</span>
                   <span className="font-bold text-xl text-slate-900">{selectedInvoice.totalAmount.toLocaleString('en-GH', { style: 'currency', currency: 'GHS' })}</span>
                 </div>
              </div>
              
              {/* Amount in words */}
              <div className="w-full mt-4 border-t border-slate-200 pt-2 text-right">
                 <p className="text-xs font-bold text-slate-500 uppercase">Amount in Words</p>
                 <p className="text-sm font-medium text-slate-800 italic">
                   {numberToWords(selectedInvoice.totalAmount)}
                 </p>
              </div>
            </div>

            {/* Signatures & Footer */}
            <div className="mt-auto">
               <div className="flex justify-between items-end mb-12">
                 <div className="w-1/2 text-xs text-slate-400 pr-8">
                   <p className="font-bold text-slate-600 mb-1">Terms & Conditions:</p>
                   <p>1. Goods once sold will not be taken back.</p>
                   <p>2. Interest @ 24% p.a. will be charged if bill is not paid within 30 days.</p>
                 </div>
                 <div className="text-center">
                    {/* Signature Line */}
                    <div className="w-48 border-b-2 border-slate-300 mb-2"></div>
                    <p className="font-bold text-slate-800">Authorized Signature</p>
                    <p className="text-xs text-slate-500">For UK Chemicals Ltd.</p>
                 </div>
               </div>
               
               <div className="border-t border-slate-200 pt-4 text-center text-xs text-slate-400">
                  Thank you for your business!
               </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // --- List View ---
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Invoices</h2>
          <p className="text-slate-500">Generate and view customer invoices.</p>
        </div>
        {currentUser?.role === 'MANAGER' && (
          <button 
            onClick={() => setViewState('CREATE')}
            className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition shadow flex items-center gap-2"
          >
            <Plus size={18} /> Create Invoice
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="p-4 font-semibold text-slate-600">Invoice No</th>
              <th className="p-4 font-semibold text-slate-600">Date</th>
              <th className="p-4 font-semibold text-slate-600">Customer</th>
              <th className="p-4 font-semibold text-slate-600 text-right">Amount</th>
              <th className="p-4 font-semibold text-slate-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400">No invoices found.</td>
              </tr>
            ) : (
              invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50 transition">
                  <td className="p-4 font-medium text-brand-600">{inv.invoiceNumber}</td>
                  <td className="p-4 text-slate-600">{new Date(inv.date).toLocaleDateString()}</td>
                  <td className="p-4 text-slate-800 font-medium">{inv.customerName}</td>
                  <td className="p-4 text-right font-bold text-slate-800">
                    {inv.totalAmount.toLocaleString('en-GH', { style: 'currency', currency: 'GHS' })}
                  </td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    <button onClick={() => handleView(inv)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-md" title="View/Download">
                      <Eye size={18} />
                    </button>
                    {currentUser?.role === 'MANAGER' && (
                      <button onClick={() => deleteInvoice(inv.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-md" title="Delete">
                        <Trash2 size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};