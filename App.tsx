import React, { useState, useEffect } from 'react';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Inventory } from './pages/Inventory';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { Suppliers } from './pages/Suppliers';
import { Invoices } from './pages/Invoices';
import { Approvals } from './pages/Approvals';
import { Login } from './components/Login';
import { SplashScreen } from './components/SplashScreen';
import { Bell, Loader2, Menu } from 'lucide-react';

const MainApp = ({ splashFinished }: { splashFinished: boolean }) => {
  const { currentUser, notifications, markNotificationRead, deleteNotification, loading } = useInventory();
  const [currentView, setCurrentView] = useState('dashboard');
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showNotifDropdown && !(e.target as Element).closest('.notif-container')) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifDropdown]);

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
    // SECURITY GUARD: Prevent non-managers from accessing Settings or Approvals
    if ((currentView === 'settings' || currentView === 'approvals') && currentUser.role !== 'MANAGER') {
      return <Dashboard setView={setCurrentView} />;
    }

    switch (currentView) {
      case 'dashboard': return <Dashboard setView={setCurrentView} />;
      case 'inventory': return <Inventory />;
      case 'reports': return <Reports />;
      case 'settings': return <Settings />;
      case 'suppliers': return <Suppliers />;
      case 'invoices': return <Invoices />;
      case 'approvals': return <Approvals />;
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
            <div className="relative notif-container">
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
                    <div className="flex items-center gap-2">
                      <span>Notifications</span>
                      {unreadCount > 0 && <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
                    </div>
                    {notifications.length > 0 && (
                      <button 
                        onClick={() => {
                          notifications.forEach(n => deleteNotification(n.id));
                        }}
                        className="text-[10px] text-brand-600 hover:underline font-normal"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="p-10 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center">
                          <Bell className="opacity-20 text-slate-400" size={24} />
                        </div>
                        <p>No notifications yet</p>
                      </div>
                    ) : (
                      notifications.slice().sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(n => (
                        <div 
                          key={n.id} 
                          className={`group relative p-3 border-b hover:bg-slate-50 transition-colors ${!n.isRead ? 'bg-brand-50/30' : ''}`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${
                              n.type === 'DANGER' ? 'text-red-500' : 
                              n.type === 'WARNING' ? 'text-orange-500' : 
                              'text-brand-600'
                            }`}>{n.title}</span>
                            <div className="flex items-center gap-2">
                               <span className="text-[9px] text-slate-400">{new Date(n.date).toLocaleDateString()}</span>
                               <button 
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   deleteNotification(n.id);
                                 }}
                                 className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 transition"
                                 title="Remove"
                               >
                                 <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                               </button>
                            </div>
                          </div>
                          <div className="cursor-pointer" onClick={() => markNotificationRead(n.id)}>
                            <p className={`text-xs leading-snug ${!n.isRead ? 'text-slate-900 font-medium' : 'text-slate-500'}`}>
                              {n.message}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {notifications.length > 5 && (
                    <div className="p-2 border-top bg-slate-50 text-center">
                       <p className="text-[10px] text-slate-400 italic">Showing your latest {notifications.length} notifications</p>
                    </div>
                  )}
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