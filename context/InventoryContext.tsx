import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, LogEntry, User, Notification, Location, UserRole, Supplier } from '../types';
import { supabase } from '../lib/supabase';

interface InventoryContextType {
  currentUser: User | null;
  users: User[];
  products: Product[];
  suppliers: Supplier[];
  logs: LogEntry[];
  notifications: Notification[];
  expiryThreshold: number;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserRole: (userId: string, newRole: UserRole) => void;
  setExpiryThreshold: (days: number) => void;
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  addSupplier: (supplier: Supplier) => void;
  updateSupplier: (supplier: Supplier) => void;
  deleteSupplier: (id: string) => void;
  adjustStock: (productId: string, location: Location, delta: number, reason: string) => void;
  transferStock: (productId: string, from: Location, to: Location, amount: number) => void;
  markNotificationRead: (id: string) => void;
  loading: boolean;
  error: string | null;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [expiryThreshold, setExpiryThresholdState] = useState<number>(30);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Initialization & Auth ---
  useEffect(() => {
    let mounted = true;

    const initializeApp = async () => {
      try {
        // 1. Check active session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // PERFORMANCE FIX: Fetch User Data and App Data in Parallel
          await Promise.all([
            fetchUserData(session.user.id, session.user.email),
            fetchAllData()
          ]);
        }
      } catch (err) {
        console.error("Initialization error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initializeApp();

    // 2. Listen for auth changes (Login, Logout, Signup)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setLoading(true);
        // Parallel fetch on login
        await Promise.all([
          fetchUserData(session.user.id, session.user.email),
          fetchAllData()
        ]);
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setProducts([]);
        setSuppliers([]);
        setLogs([]);
        setNotifications([]);
        setUsers([]);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Check thresholds whenever products or threshold changes
  useEffect(() => {
    if (products.length > 0) {
      products.forEach(p => checkThresholds(p, expiryThreshold));
    }
  }, [products, expiryThreshold]);

  const fetchUserData = async (userId: string, userEmail?: string) => {
    try {
      // --- ADMIN IDENTITY CHECK ---
      const ADMIN_EMAIL = "sagyeimensah@yahoo.com";
      const isAdminUser = userEmail && userEmail.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();

      // OPTIMIZATION: Admin Bypass
      // If it's the admin email, strictly force Manager role immediately to avoid UI flicker
      if (isAdminUser) {
        // We still try to fetch DB to get name, but we ensure role is MANAGER
        let { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
        
        if (!data && error) {
          // If missing, create it
          console.log("Admin profile missing, creating...");
          await supabase.from('profiles').upsert({
             id: userId, 
             email: userEmail, 
             role: 'MANAGER', 
             full_name: 'Manager'
          });
          setCurrentUser({ id: userId, name: 'Manager', email: userEmail!, role: 'MANAGER' });
          return;
        }

        // Force update if DB says otherwise
        if (data && data.role !== 'MANAGER') {
           supabase.from('profiles').update({ role: 'MANAGER' }).eq('id', userId);
        }
        
        setCurrentUser({
          id: userId,
          name: data?.full_name || 'Manager',
          email: userEmail!,
          role: 'MANAGER'
        });
        return;
      }

      // Normal User Fetch
      let { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      
      // FAIL-SAFE: If profile doesn't exist (trigger failed), try to create it manually
      if (error && error.code === 'PGRST116' && userEmail) {
        console.log("Profile missing, attempting fallback creation...");
        const { data: newData, error: insertError } = await supabase
          .from('profiles')
          .insert([{ 
            id: userId, 
            email: userEmail, 
            role: 'STAFF', 
            full_name: 'Staff Member' 
          }])
          .select()
          .single();
        
        if (newData) {
          data = newData;
        } else if (insertError) {
           // If table missing entirely, mock it to prevent app crash
           if (insertError.message?.includes('Could not find the table')) {
             console.error("DB Tables Missing. Using temporary session.");
             setCurrentUser({ id: userId, name: 'Staff (DB Offline)', email: userEmail, role: 'STAFF' });
             return;
           }
        }
      }

      if (data) {
        setCurrentUser({
          id: data.id,
          name: data.full_name,
          email: data.email,
          role: data.role as UserRole
        });
      }
    } catch (e) {
      console.error("Profile fetch error", e);
    }
  };

  const fetchAllData = async () => {
    try {
      // PERFORMANCE FIX: Use Promise.all to fetch everything in parallel
      const [
        prodResult,
        supResult,
        logResult,
        userResult,
        settingsResult
      ] = await Promise.all([
        supabase.from('products').select('*'),
        supabase.from('suppliers').select('*'),
        supabase.from('logs').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('profiles').select('*'),
        supabase.from('app_settings').select('*').eq('key', 'expiry_threshold').single()
      ]);

      // 1. Products
      if (prodResult.data) {
        const mappedProducts: Product[] = prodResult.data.map((p: any) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          unit: p.unit,
          qtyWarehouse: p.qty_warehouse,
          qtyOffice: p.qty_office,
          reorderLevel: p.reorder_level,
          productionDate: p.production_date,
          expirationDate: p.expiration_date,
          origin: p.origin,
          deliveryAgent: p.delivery_agent,
          price: p.price,
          supplier: p.supplier
        }));
        setProducts(mappedProducts);
      }

      // 2. Suppliers
      if (supResult.data) {
        const mappedSuppliers: Supplier[] = supResult.data.map((s: any) => ({
          id: s.id,
          companyName: s.company_name,
          contactName: s.contact_name,
          email: s.email,
          phone: s.phone
        }));
        setSuppliers(mappedSuppliers);
      }

      // 3. Logs
      if (logResult.data) {
        const mappedLogs: LogEntry[] = logResult.data.map((l: any) => ({
          id: l.id,
          date: l.created_at,
          action: l.action,
          productName: l.product_name,
          details: l.details,
          performedBy: l.performed_by
        }));
        setLogs(mappedLogs);
      }

      // 4. Users (for settings)
      if (userResult.data) {
        const mappedUsers: User[] = userResult.data.map((u: any) => ({
          id: u.id,
          name: u.full_name,
          email: u.email,
          role: u.role as UserRole
        }));
        setUsers(mappedUsers);
      }

      // 5. Settings
      if (settingsResult.data) {
        setExpiryThresholdState(parseInt(settingsResult.data.value));
      }

    } catch (e) {
      console.error("Error fetching data", e);
    }
  };

  // --- Auth Methods ---

  const login = async (email: string, pass: string) => {
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
  };

  const signup = async (email: string, pass: string, name: string) => {
    setError(null);
    const { error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: { data: { full_name: name } }
    });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  // --- Helpers ---

  const addLog = async (action: LogEntry['action'], productName: string, details: string) => {
    if (!currentUser) return;
    
    const newLog = {
      action,
      product_name: productName,
      details,
      performed_by: currentUser.name,
    };

    // Optimistic update
    const tempId = Math.random().toString();
    const optimisiticLog: LogEntry = {
      id: tempId,
      date: new Date().toISOString(),
      action,
      productName,
      details,
      performedBy: currentUser.name
    };
    setLogs(prev => [optimisiticLog, ...prev]);

    const { data, error } = await supabase.from('logs').insert(newLog).select().single();
    
    if (data) {
       // Replace optimistic log with real one
       setLogs(prev => prev.map(l => l.id === tempId ? {
          id: data.id,
          date: data.created_at,
          action: data.action,
          productName: data.product_name,
          details: data.details,
          performedBy: data.performed_by
       } : l));
    } else if (error) {
       // Revert on error
       console.error("Log failed", error);
       setLogs(prev => prev.filter(l => l.id !== tempId));
    }
  };

  const checkThresholds = (product: Product, thresholdDays: number) => {
    const totalStock = product.qtyWarehouse + product.qtyOffice;
    
    // Low Stock
    if (totalStock <= product.reorderLevel) {
      const alertId = `low-${product.id}`;
      setNotifications(prev => {
         if (prev.some(n => n.id === alertId)) return prev;
         return [{
          id: alertId,
          title: 'Low Stock Alert',
          message: `${product.name} is below reorder level.`,
          type: 'WARNING',
          date: new Date().toISOString(),
          isRead: false
        }, ...prev];
      });
    }

    // Expiry
    const daysUntil = Math.ceil((new Date(product.expirationDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
    if (daysUntil <= thresholdDays) {
       const alertId = `exp-${product.id}`;
       setNotifications(prev => {
         if (prev.some(n => n.id === alertId)) return prev;
         return [{
           id: alertId,
           title: daysUntil < 0 ? 'Expired' : 'Expiring Soon',
           message: `${product.name} expires in ${daysUntil} days.`,
           type: 'DANGER',
           date: new Date().toISOString(),
           isRead: false
         }, ...prev];
       });
    }
  };

  // --- Data Operations ---

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    if (currentUser?.role !== 'MANAGER') {
      alert("Only managers can update roles.");
      return;
    }
    // Optimistic update
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    if (error) {
       console.error("Failed to update role", error);
       // Revert if needed (fetching data again would also fix it)
       fetchAllData();
    } else {
      addLog('UPDATE', 'User Role', `Updated user ${userId} to ${newRole}`);
    }
  };

  const setExpiryThreshold = async (days: number) => {
    if (currentUser?.role !== 'MANAGER') return;
    setExpiryThresholdState(days);
    await supabase.from('app_settings').upsert({ key: 'expiry_threshold', value: days.toString() });
  };

  const addProduct = async (product: Product) => {
    if (currentUser?.role !== 'MANAGER') {
      alert("Access Denied: Only managers can add products.");
      return;
    }

    const dbProduct = {
      name: product.name,
      category: product.category,
      unit: product.unit,
      qty_warehouse: product.qtyWarehouse,
      qty_office: product.qtyOffice,
      reorder_level: product.reorderLevel,
      production_date: product.productionDate,
      expiration_date: product.expirationDate,
      origin: product.origin,
      delivery_agent: product.deliveryAgent,
      price: product.price,
      supplier: product.supplier
    };

    const { data, error } = await supabase.from('products').insert(dbProduct).select().single();
    if (data) {
      const newProd: Product = { ...product, id: data.id };
      setProducts(prev => [...prev, newProd]);
      addLog('CREATE', product.name, 'Product created');
    } else if (error) {
      console.error(error);
    }
  };

  const updateProduct = async (product: Product) => {
    if (currentUser?.role !== 'MANAGER') {
      alert("Access Denied: Only managers can edit products.");
      return;
    }

    const dbProduct = {
      name: product.name,
      category: product.category,
      unit: product.unit,
      qty_warehouse: product.qtyWarehouse,
      qty_office: product.qtyOffice,
      reorder_level: product.reorderLevel,
      production_date: product.productionDate,
      expiration_date: product.expirationDate,
      origin: product.origin,
      delivery_agent: product.deliveryAgent,
      price: product.price,
      supplier: product.supplier
    };

    const { error } = await supabase.from('products').update(dbProduct).eq('id', product.id);
    if (!error) {
      setProducts(prev => prev.map(p => p.id === product.id ? product : p));
      addLog('UPDATE', product.name, 'Product updated');
    }
  };

  const deleteProduct = async (id: string) => {
    if (currentUser?.role !== 'MANAGER') {
      alert("Access Denied: Only managers can delete products.");
      return;
    }

    const pName = products.find(p => p.id === id)?.name || 'Product';
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) {
      setProducts(prev => prev.filter(p => p.id !== id));
      addLog('DELETE', pName, 'Product deleted');
    }
  };

  const addSupplier = async (supplier: Supplier) => {
    if (currentUser?.role !== 'MANAGER') return;
    const dbSupplier = {
      company_name: supplier.companyName,
      contact_name: supplier.contactName,
      email: supplier.email,
      phone: supplier.phone
    };
    const { data } = await supabase.from('suppliers').insert(dbSupplier).select().single();
    if (data) {
      setSuppliers(prev => [...prev, { ...supplier, id: data.id }]);
      addLog('CREATE', supplier.companyName, 'Supplier added');
    }
  };

  const updateSupplier = async (supplier: Supplier) => {
    if (currentUser?.role !== 'MANAGER') return;
    const dbSupplier = {
      company_name: supplier.companyName,
      contact_name: supplier.contactName,
      email: supplier.email,
      phone: supplier.phone
    };
    const { error } = await supabase.from('suppliers').update(dbSupplier).eq('id', supplier.id);
    if (!error) {
      setSuppliers(prev => prev.map(s => s.id === supplier.id ? supplier : s));
      addLog('UPDATE', supplier.companyName, 'Supplier updated');
    }
  };

  const deleteSupplier = async (id: string) => {
    if (currentUser?.role !== 'MANAGER') return;
    const sName = suppliers.find(s => s.id === id)?.companyName || 'Supplier';
    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    if (!error) {
      setSuppliers(prev => prev.filter(s => s.id !== id));
      addLog('DELETE', sName, 'Supplier deleted');
    }
  };

  const adjustStock = async (productId: string, location: Location, delta: number, reason: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const updates: any = {};
    if (location === 'Warehouse') updates.qty_warehouse = product.qtyWarehouse + delta;
    else updates.qty_office = product.qtyOffice + delta;

    const { error } = await supabase.from('products').update(updates).eq('id', productId);
    
    if (!error) {
      setProducts(prev => prev.map(p => {
         if (p.id !== productId) return p;
         return location === 'Warehouse' 
           ? { ...p, qtyWarehouse: p.qtyWarehouse + delta }
           : { ...p, qtyOffice: p.qtyOffice + delta };
      }));
      addLog(delta > 0 ? 'ADD' : 'REMOVE', product.name, `${delta > 0 ? 'Added' : 'Removed'} ${Math.abs(delta)} (${location}). Reason: ${reason}`);
    }
  };

  const transferStock = async (productId: string, from: Location, to: Location, amount: number) => {
     const product = products.find(p => p.id === productId);
     if (!product) return;

     const updates: any = {};
     const currentFrom = from === 'Warehouse' ? product.qtyWarehouse : product.qtyOffice;
     const currentTo = to === 'Warehouse' ? product.qtyWarehouse : product.qtyOffice;
     
     if (from === 'Warehouse') {
        updates.qty_warehouse = currentFrom - amount;
        updates.qty_office = currentTo + amount;
     } else {
        updates.qty_office = currentFrom - amount;
        updates.qty_warehouse = currentTo + amount;
     }

     const { error } = await supabase.from('products').update(updates).eq('id', productId);
     
     if (!error) {
       setProducts(prev => prev.map(p => {
         if (p.id !== productId) return p;
         return { ...p, qtyWarehouse: updates.qty_warehouse ?? p.qtyWarehouse, qtyOffice: updates.qty_office ?? p.qtyOffice };
       }));
       addLog('TRANSFER', product.name, `Transferred ${amount} from ${from} to ${to}`);
     }
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  return (
    <InventoryContext.Provider value={{
      currentUser,
      users,
      products,
      suppliers,
      logs,
      notifications,
      expiryThreshold,
      loading,
      error,
      login,
      signup,
      logout,
      updateUserRole,
      setExpiryThreshold,
      addProduct,
      updateProduct,
      deleteProduct,
      addSupplier,
      updateSupplier,
      deleteSupplier,
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