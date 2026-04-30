import React from 'react';
import { useInventory } from '../context/InventoryContext';
import { CheckCircle2, XCircle, Clock, User, Package, Calendar } from 'lucide-react';

export const Approvals = () => {
  const { approvalRequests, resolveApprovalRequest, currentUser } = useInventory();

  if (currentUser?.role?.toUpperCase() !== 'MANAGER') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500">
        <XCircle size={48} className="text-red-500 mb-4" />
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p>This page is only accessible to managers.</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full flex items-center gap-1 w-fit"><Clock size={12} /> Pending</span>;
      case 'approved':
        return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full flex items-center gap-1 w-fit"><CheckCircle2 size={12} /> Approved</span>;
      case 'denied':
        return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full flex items-center gap-1 w-fit"><XCircle size={12} /> Denied</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Approval Requests</h2>
        <p className="text-slate-500">Review and authorize employee actions.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-600 text-sm font-semibold">
              <tr>
                <th className="p-4 border-b border-slate-100">Employee</th>
                <th className="p-4 border-b border-slate-100">Action</th>
                <th className="p-4 border-b border-slate-100">Product</th>
                <th className="p-4 border-b border-slate-100">Date Requested</th>
                <th className="p-4 border-b border-slate-100">Status</th>
                <th className="p-4 border-b border-slate-100 text-right">Resolved By</th>
                <th className="p-4 border-b border-slate-100 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-slate-700 divide-y divide-slate-100">
              {approvalRequests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/50 transition">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-brand-50 text-brand-600 rounded-full">
                        <User size={14} />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{req.requested_by_name}</p>
                        <p className="text-[10px] text-slate-500">{req.requested_by_email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      req.action_type === 'delete' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                    }`}>
                      {req.action_type}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1 text-sm font-medium">
                      <Package size={14} className="text-slate-400" /> {req.product_name}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Calendar size={12} /> {new Date(req.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="p-4">
                    {getStatusBadge(req.status)}
                  </td>
                  <td className="p-4 text-right text-xs text-slate-500">
                    {req.resolved_by || '-'}
                    {req.resolved_at && (
                      <p className="text-[10px]">{new Date(req.resolved_at).toLocaleDateString()}</p>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    {req.status === 'pending' && (
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => resolveApprovalRequest(req.id, 'approved')}
                          className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded shadow-sm hover:bg-emerald-700 transition"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => resolveApprovalRequest(req.id, 'denied')}
                          className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded shadow-sm hover:bg-red-700 transition"
                        >
                          Deny
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {approvalRequests.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                    No approval requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
