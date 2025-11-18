import React, { useState } from 'react';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Inventory } from './pages/Inventory';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { Suppliers } from './pages/Suppliers';
import { Login } from './components/Login';
import { Bell, Loader2 } from 'lucide-react';

const MainApp = () => {
  const { currentUser, notifications, markNotificationRead, loading } = useInventory();
  const [currentView, setCurrentView] = useState('dashboard');
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-400">
        <Loader2 size={48} className="animate-spin mb-4 text-brand-600" />
        <p>Loading UKChem System...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Login />;
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const renderView = () => {
    // SECURITY GUARD: Prevent non-managers from accessing Settings
    if (currentView === 'settings' && currentUser.role !== 'MANAGER') {
      return <Dashboard setView={setCurrentView} />;
    }

    switch (currentView) {
      case 'dashboard': return <Dashboard setView={setCurrentView} />;
      case 'inventory': return <Inventory />;
      case 'reports': return <Reports />;
      case 'settings': return <Settings />;
      case 'suppliers': return <Suppliers />;
      default: return <Dashboard setView={setCurrentView} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
      
      <div className="flex-1 md:ml-64 flex flex-col h-screen">
        {/* Topbar */}
        <header className="bg-white h-16 border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="md:hidden font-bold text-brand-600">UKChem</div>
          <div className="hidden md:block text-sm breadcrumbs text-slate-400">
            UK Chemicals / <span className="text-slate-800 font-medium capitalize">{currentView.replace('_', ' ')}</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button 
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className="p-2 text-slate-400 hover:bg-slate-100 rounded-full relative transition"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>

              {showNotifDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50">
                  <div className="p-3 border-b bg-slate-50 font-semibold text-sm text-slate-700">Notifications</div>
                  <div className="max-h-64 overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">No notifications</div>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n.id} 
                          onClick={() => markNotificationRead(n.id)}
                          className={`p-3 border-b hover:bg-slate-50 cursor-pointer ${!n.isRead ? 'bg-blue-50/50' : ''}`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className={`text-xs font-bold ${n.type === 'DANGER' ? 'text-red-600' : n.type === 'WARNING' ? 'text-orange-600' : 'text-blue-600'}`}>{n.title}</span>
                            <span className="text-[10px] text-slate-400">{new Date(n.date).toLocaleDateString()}</span>
                          </div>
                          <p className="text-xs text-slate-600 leading-snug">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            {renderView()}
          </div>
        </main>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <InventoryProvider>
      <MainApp />
    </InventoryProvider>
  );
};

export default App;