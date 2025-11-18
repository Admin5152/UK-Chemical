import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, LogEntry, User, Notification, Location } from '../types';
import { INITIAL_PRODUCTS, MOCK_USERS } from '../constants';

interface InventoryContextType {
  currentUser: User | null;
  products: Product[];
  logs: LogEntry[];
  notifications: Notification[];
  login: (role: 'MANAGER' | 'STAFF') => void;
  logout: () => void;
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (productId: string, location: Location, delta: number, reason: string) => void;
  transferStock: (productId: string, from: Location, to: Location, amount: number) => void;
  markNotificationRead: (id: string) => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Simulate Email Service
  const sendEmailAlert = (to: string, subject: string, body: string) => {
    console.log(`[EMAIL SIMULATION] To: ${to} | Subject: ${subject} | Body: ${body}`);
    // In a real app, this would call EmailJS or a backend endpoint
  };

  // Login Logic
  const login = (role: 'MANAGER' | 'STAFF') => {
    const user = MOCK_USERS.find(u => u.role === role);
    if (user) setCurrentUser(user);
  };

  const logout = () => setCurrentUser(null);

  // Helper to create log
  const addLog = (action: LogEntry['action'], productName: string, details: string) => {
    if (!currentUser) return;
    const newLog: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      action,
      productName,
      details,
      performedBy: currentUser.name,
    };
    setLogs(prev => [newLog, ...prev]);
  };

  // Helper to check thresholds and create notifications
  const checkThresholds = (product: Product) => {
    const totalStock = product.qtyWarehouse + product.qtyOffice;
    
    // Low Stock Alert
    if (totalStock <= product.reorderLevel) {
      const alertId = `low-${product.id}-${new Date().toDateString()}`;
      const exists = notifications.find(n => n.id === alertId);
      
      if (!exists) {
        const newNotif: Notification = {
          id: alertId,
          title: 'Low Stock Alert',
          message: `${product.name} is below reorder level (${totalStock} < ${product.reorderLevel}).`,
          type: 'WARNING',
          date: new Date().toISOString(),
          isRead: false
        };
        setNotifications(prev => [newNotif, ...prev]);
        
        // Simulate Email
        sendEmailAlert(
          'manager@ukchem.com', 
          `URGENT: Low Stock - ${product.name}`, 
          `Current stock: ${totalStock}. Please reorder.`
        );
      }
    }

    // Expiry Alert
    const daysUntilExpiry = Math.ceil((new Date(product.expirationDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
    if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
       const alertId = `exp-${product.id}-${new Date().toDateString()}`;
       const exists = notifications.find(n => n.id === alertId);
       if (!exists) {
         const newNotif: Notification = {
           id: alertId,
           title: 'Expiry Warning',
           message: `${product.name} expires in ${daysUntilExpiry} days.`,
           type: 'DANGER',
           date: new Date().toISOString(),
           isRead: false
         };
         setNotifications(prev => [newNotif, ...prev]);
       }
    }
  };

  // CRUD
  const addProduct = (product: Product) => {
    setProducts(prev => [...prev, product]);
    addLog('CREATE', product.name, 'Initial product creation');
    checkThresholds(product);
  };

  const updateProduct = (updated: Product) => {
    setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
    addLog('UPDATE', updated.name, 'Product details updated');
    checkThresholds(updated);
  };

  const deleteProduct = (id: string) => {
    const p = products.find(prod => prod.id === id);
    if (p) {
      setProducts(prev => prev.filter(prod => prod.id !== id));
      addLog('DELETE', p.name, 'Product removed from system');
    }
  };

  const adjustStock = (productId: string, location: Location, delta: number, reason: string) => {
    setProducts(prev => prev.map(p => {
      if (p.id !== productId) return p;
      
      const updated = { ...p };
      if (location === 'Warehouse') updated.qtyWarehouse += delta;
      else updated.qtyOffice += delta;
      
      addLog(delta > 0 ? 'ADD' : 'REMOVE', p.name, `${delta > 0 ? 'Added' : 'Removed'} ${Math.abs(delta)} ${p.unit} at ${location}. Reason: ${reason}`);
      
      checkThresholds(updated);
      return updated;
    }));
  };

  const transferStock = (productId: string, from: Location, to: Location, amount: number) => {
     setProducts(prev => prev.map(p => {
      if (p.id !== productId) return p;

      const updated = { ...p };
      if (from === 'Warehouse') updated.qtyWarehouse -= amount;
      else updated.qtyOffice -= amount;

      if (to === 'Warehouse') updated.qtyWarehouse += amount;
      else updated.qtyOffice += amount;

      addLog('TRANSFER', p.name, `Transferred ${amount} ${p.unit} from ${from} to ${to}`);
      return updated;
     }));
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  return (
    <InventoryContext.Provider value={{
      currentUser,
      products,
      logs,
      notifications,
      login,
      logout,
      addProduct,
      updateProduct,
      deleteProduct,
      adjustStock,
      transferStock,
      markNotificationRead
    }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) throw new Error('useInventory must be used within InventoryProvider');
  return context;
};