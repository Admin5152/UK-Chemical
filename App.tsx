import React, { useState, useEffect } from 'react';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Inventory } from './pages/Inventory';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { Suppliers } from './pages/Suppliers';
import { Invoices } from './pages/Invoices';
import { Login } from './components/Login';
import { SplashScreen } from './components/SplashScreen';
import { Bell, Loader2, Menu } from 'lucide-react';

const MainApp = ({ splashFinished }: { splashFinished: boolean }) => {
  const { currentUser, notifications, markNotificationRead, loading } = useInventory();
  const [currentView, setCurrentView] = useState('dashboard');
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // While Splash is showing, we render nothing here (Splash covers it)
  // Once Splash finishes, if we are still loading data, we show a spinner
  // If not loading, we show Login or Dashboard
  if (!splashFinished) return null;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-400 fade-in">
        <Loader2 size={48} className="animate-spin mb-4 text-brand-600" />
        <p className="text-sm font-medium">Finalizing setup...</p>
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
      case 'invoices': return <Invoices />;
      default: return <Dashboard setView={setCurrentView} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 overflow-hidden animate-fade-in">
      {/* Mobile Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />
      
      <div className="flex-1 flex flex-col h-screen w-full relative">
        {/* Topbar */}
        <header className="bg-white h-16 border-b border-slate-200 flex items-center justify-between px-4 md:px-6 sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-3">
            {/* Hamburger Menu */}
            <button 
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-md md:hidden transition-colors"
            >
              <Menu size={24} />
            </button>
            
            <div className="md:hidden font-bold text-brand-600 text-lg truncate">UKChem</div>
            <div className="hidden md:block text-sm breadcrumbs text-slate-400">
              UK Chemicals / <span className="text-slate-800 font-medium capitalize">{currentView.replace('_', ' ')}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <div className="relative">
              <button 
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className="p-2 text-slate-400 hover:bg-slate-100 rounded-full relative transition"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-bounce"></span>
                )}
              </button>

              {showNotifDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-3 border-b bg-slate-50 font-semibold text-sm text-slate-700 flex justify-between items-center">
                    <span>Notifications</span>
                    {unreadCount > 0 && <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full">{unreadCount} new</span>}
                  </div>
                  <div className="max-h-64 overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">
                        <Bell className="mx-auto mb-2 opacity-20" size={24} />
                        No notifications
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n.id} 
                          onClick={() => markNotificationRead(n.id)}
                          className={`p-3 border-b hover:bg-slate-50 cursor-pointer transition-colors ${!n.isRead ? 'bg-blue-50/50' : ''}`}
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

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar w-full bg-slate-50/50">
          <div className="max-w-7xl mx-auto animate-fade-in-up">
            {renderView()}
          </div>
        </main>
      </div>
    </div>
  );
};

const App = () => {
  const [splashFinished, setSplashFinished] = useState(false);

  return (
    <>
      {/* Splash Screen shows on top of everything until it calls onComplete */}
      {!splashFinished && (
        <SplashScreen onComplete={() => setSplashFinished(true)} />
      )}
      
      {/* The Provider is mounted immediately so data starts loading BEHIND the splash screen */}
      <InventoryProvider>
        <MainApp splashFinished={splashFinished} />
      </InventoryProvider>
    </>
  );
};

export default App;