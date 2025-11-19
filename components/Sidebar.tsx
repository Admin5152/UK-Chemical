import React from 'react';
import { LayoutDashboard, Package, FileBarChart, Settings, LogOut, Truck, X, FileText } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, isOpen, onClose }) => {
  const { currentUser, logout } = useInventory();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'reports', label: 'Reports', icon: FileBarChart },
    { id: 'suppliers', label: 'Suppliers', icon: Truck },
    { id: 'invoices', label: 'Invoices', icon: FileText },
  ];

  if (currentUser?.role === 'MANAGER') {
    menuItems.push({ id: 'settings', label: 'Settings', icon: Settings });
  }

  const handleLogout = async () => {
    try {
      onClose(); // Close sidebar on mobile
      await logout();
    } catch (e) {
      console.error("Logout failed", e);
    }
  };

  const handleNavClick = (id: string) => {
    setCurrentView(id);
    onClose(); // Close sidebar on mobile when an item is selected
  };

  return (
    <>
      {/* Sidebar Container */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out shadow-xl
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 md:static md:h-screen md:shadow-none
      `}>
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-500 rounded-md flex items-center justify-center font-bold text-white">
              UK
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-wide">UK Chemicals</h1>
              <p className="text-xs text-slate-400">Inv. Management</p>
            </div>
          </div>
          {/* Close Button (Mobile Only) */}
          <button 
            onClick={onClose}
            className="md:hidden p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-brand-600 text-white shadow-lg' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-700 bg-slate-900">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-sm font-semibold flex-shrink-0">
              {currentUser?.name?.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{currentUser?.name || 'User'}</p>
              <p className="text-xs text-slate-400 truncate">{currentUser?.role}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 p-2 text-sm text-red-300 hover:bg-red-900/20 rounded-md transition-colors"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
};