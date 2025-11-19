import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { Product, LogEntry, User, Notification, Location, UserRole, Supplier, Invoice } from '../types';
import { supabase } from '../lib/supabase';

interface InventoryContextType {
  currentUser: User | null;
  users: User[];
  products: Product[];
  suppliers: Supplier[];
  invoices: Invoice[];
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
  addInvoice: (invoice: Omit<Invoice, 'id'>) => Promise<void>;
  deleteInvoice: (id: string) => void;
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
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [expiryThreshold, setExpiryThresholdState] = useState<number>(30);
  
  // Initialize currentUser from localStorage for instant load perception
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('ukchem_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) { return null; }
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const isFetching = useRef(false);
  const currentUserIdRef = useRef<string | null>(currentUser?.id || null);

  // --- Initialization & Auth ---
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        await handleUserSession(session.user.id, session.user.email);
      } else {
        clearData();
        if (mounted) setLoading(false);
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'TOKEN_REFRESHED') return; 

        if (session?.user) {
          if (session.user.id !== currentUserIdRef.current || products.length === 0) {
             await handleUserSession(session.user.id, session.user.email);
          }
        } else if (event === 'SIGNED_OUT') {
          clearData();
          setLoading(false);
        }
      });

      return () => subscription.unsubscribe();
    };

    init();

    return () => { mounted = false; };
  }, []);

  const clearData = () => {
    setCurrentUser(null);
    currentUserIdRef.current = null;
    setUsers([]);
    setProducts([]);
    setSuppliers([]);
    setInvoices([]);
    setLogs([]);
    setNotifications([]);
    localStorage.removeItem('ukchem_user');
  };

  const handleUserSession = async (userId: string, email: string | undefined) => {
    if (isFetching.current) return;
    isFetching.current = true;

    try {
      // Admin Override Logic
      const isSuperAdmin = email === 'sagyeimensah@yahoo.com';

      let { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError || !profile) {
        const newProfile = {
          id: userId,
          email: email,
          full_name: 'Staff Member',
          role: isSuperAdmin ? 'MANAGER' : 'STAFF'
        };
        // Try to create profile, if fails (table missing), we handle graceful auth below
        try {
           await supabase.from('profiles').insert(newProfile).select().single();
        } catch(e) { console.warn("Profile creation failed", e); }
        profile = newProfile;
      }

      if (isSuperAdmin) {
        profile.role = 'MANAGER';
        // Try to sync role to DB in background
        supabase.from('profiles').update({ role: 'MANAGER' }).eq('id', userId).then();
      }

      const userObj: User = {
        id: profile.id,
        name: profile.full_name || email?.split('@')[0] || 'User',
        email: profile.email || email || '',
        role: profile.role as UserRole
      };

      setCurrentUser(userObj);
      currentUserIdRef.current = userId;
      localStorage.setItem('ukchem_user', JSON.stringify(userObj));

      await fetchAllData();

    } catch (err: any) {
      console.error("Session Init Error:", err);
      // Fallback for Super Admin even if DB fails completely
      if (email === 'sagyeimensah@yahoo.com') {
         const fallbackAdmin: User = { id: userId, name: 'Manager', email: email, role: 'MANAGER' };
         setCurrentUser(fallbackAdmin);
         localStorage.setItem('ukchem_user', JSON.stringify(fallbackAdmin));
      }
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  };

  const fetchAllData = async () => {
    try {
      // Use Promise.allSettled-like behavior by catching individual errors
      const [productsRes, suppliersRes, logsRes, usersRes, settingsRes, invoicesRes] = await Promise.all([
        supabase.from('products').select('*'),
        supabase.from('suppliers').select('*'),
        supabase.from('logs').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('profiles').select('*'),
        supabase.from('app_settings').select('*').eq('key', 'expiry_threshold').single(),
        supabase.from('invoices').select('*').order('created_at', { ascending: false })
      ]);

      if (productsRes.data) {
        const formattedProducts = productsRes.data.map(p => ({
          id: p.id,
          name: p.name,
          category: p.category,
          unit: p.unit,
          qtyWarehouse: Number(p.qty_warehouse),
          qtyOffice: Number(p.qty_office),
          reorderLevel: Number(p.reorder_level),
          productionDate: p.production_date,
          expirationDate: p.expiration_date,
          origin: p.origin,
          deliveryAgent: p.delivery_agent,
          price: Number(p.price),
          supplier: p.supplier
        }));
        setProducts(formattedProducts);
        checkNotifications(formattedProducts, settingsRes.data?.value || 30);
      }

      if (suppliersRes.data) {
        setSuppliers(suppliersRes.data.map(s => ({
          id: s.id,
          companyName: s.company_name,
          contactName: s.contact_name,
          email: s.email,
          phone: s.phone
        })));
      }

      // Invoice Logic with Strong Fallback
      if (invoicesRes.data) {
        setInvoices(invoicesRes.data.map(i => ({
          id: i.id,
          invoiceNumber: i.invoice_number,
          customerName: i.customer_name,
          customerAddress: i.customer_address,
          customerContact: i.customer_contact,
          date: i.date,
          items: Array.isArray(i.items) ? i.items : [], // Safety check
          totalAmount: Number(i.total_amount)
        })));
      } else if (invoicesRes.error) {
        // Fallback to Local Storage if Supabase fails (e.g. missing table)
        console.warn("Invoices Table Missing/Error, using LocalStorage");
        try {
          const localInvoices = localStorage.getItem('ukchem_invoices');
          if (localInvoices) {
            setInvoices(JSON.parse(localInvoices));
          }
        } catch (e) { console.error("Local invoice load failed", e); }
      }

      if (logsRes.data) {
        setLogs(logsRes.data.map(l => ({
          id: l.id,
          date: l.created_at,
          action: l.action,
          productName: l.product_name,
          details: l.details,
          performedBy: l.performed_by
        })));
      }

      if (usersRes.data) {
        setUsers(usersRes.data.map(u => ({
          id: u.id,
          name: u.full_name,
          email: u.email,
          role: u.role as UserRole
        })));
      }
      
      if (settingsRes.data) {
        setExpiryThresholdState(Number(settingsRes.data.value));
      }

    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const checkNotifications = (currentProducts: Product[], threshold: number) => {
    const newNotifs: Notification[] = [];
    const now = new Date();
    const warningDate = new Date();
    warningDate.setDate(now.getDate() + threshold);

    currentProducts.forEach(p => {
      const total = p.qtyWarehouse + p.qtyOffice;
      const expiry = new Date(p.expirationDate);

      if (total <= p.reorderLevel) {
        newNotifs.push({
          id: `low-${p.id}`,
          title: 'Low Stock Alert',
          message: `${p.name} is low (${total} ${p.unit}).`,
          type: 'WARNING',
          date: new Date().toISOString(),
          isRead: false
        });
      }

      if (expiry < now) {
        newNotifs.push({
          id: `exp-${p.id}`,
          title: 'Product Expired',
          message: `${p.name} expired on ${expiry.toLocaleDateString()}.`,
          type: 'DANGER',
          date: new Date().toISOString(),
          isRead: false
        });
      } else if (expiry < warningDate) {
        newNotifs.push({
          id: `soon-${p.id}`,
          title: 'Expiring Soon',
          message: `${p.name} expires in ${Math.ceil((expiry.getTime() - now.getTime())/(1000*60*60*24))} days.`,
          type: 'INFO',
          date: new Date().toISOString(),
          isRead: false
        });
      }
    });
    setNotifications(newNotifs);
  };

  // --- Actions ---

  const logAction = async (action: string, productName: string, details: string) => {
    if (!currentUser) return;
    const newLog = {
      action,
      product_name: productName,
      details,
      performed_by: currentUser.name
    };
    
    const optimisticLog: LogEntry = {
      id: Math.random().toString(),
      date: new Date().toISOString(),
      action: action as any,
      productName,
      details,
      performedBy: currentUser.name
    };
    setLogs(prev => [optimisticLog, ...prev]);

    await supabase.from('logs').insert(newLog);
  };

  const addProduct = async (product: Product) => {
    if (currentUser?.role !== 'MANAGER') return;
    
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
    
    if (data && !error) {
      const newProduct = { ...product, id: data.id };
      setProducts(prev => [...prev, newProduct]);
      logAction('CREATE', product.name, 'Added new product');
      checkNotifications([...products, newProduct], expiryThreshold);
    }
  };

  const updateProduct = async (product: Product) => {
    if (currentUser?.role !== 'MANAGER') return;

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
      logAction('UPDATE', product.name, 'Updated details');
      checkNotifications(products.map(p => p.id === product.id ? product : p), expiryThreshold);
    }
  };

  const deleteProduct = async (id: string) => {
    if (currentUser?.role !== 'MANAGER') return;
    const pName = products.find(p => p.id === id)?.name || 'Product';
    
    const { error } = await supabase.from('products').delete().eq('id', id);
    
    if (!error) {
      setProducts(prev => prev.filter(p => p.id !== id));
      logAction('DELETE', pName, 'Deleted product');
    }
  };

  const addInvoice = async (invoice: Omit<Invoice, 'id'>) => {
    if (currentUser?.role !== 'MANAGER') return;

    const dbInvoice = {
      invoice_number: invoice.invoiceNumber,
      customer_name: invoice.customerName,
      customer_address: invoice.customerAddress,
      customer_contact: invoice.customerContact,
      date: invoice.date,
      items: invoice.items,
      total_amount: invoice.totalAmount,
      created_by: currentUser.id
    };

    // Try to insert into Supabase
    const { data, error } = await supabase.from('invoices').insert(dbInvoice).select().single();
    
    if (data && !error) {
      // Database Success
      const newInvoice = { ...invoice, id: data.id };
      setInvoices(prev => [newInvoice, ...prev]);
      logAction('CREATE', `Invoice ${invoice.invoiceNumber}`, `Created invoice for ${invoice.customerName}`);
    } else {
      // Fallback to Local Storage if database insert fails (e.g. table missing)
      console.warn("Database Insert Failed, Saving Locally", error);
      const fallbackId = Math.random().toString();
      const newInvoice = { ...invoice, id: fallbackId };
      
      setInvoices(prev => {
        const updated = [newInvoice, ...prev];
        localStorage.setItem('ukchem_invoices', JSON.stringify(updated));
        return updated;
      });
      logAction('CREATE', `Invoice ${invoice.invoiceNumber}`, `Created invoice (Local Save)`);
    }
  };

  const deleteInvoice = async (id: string) => {
    if (currentUser?.role !== 'MANAGER') return;
    
    // Try delete from Supabase
    await supabase.from('invoices').delete().eq('id', id);
    
    // Always update local state and localStorage to be safe
    setInvoices(prev => {
      const updated = prev.filter(i => i.id !== id);
      localStorage.setItem('ukchem_invoices', JSON.stringify(updated));
      return updated;
    });
  };

  const adjustStock = async (productId: string, location: Location, delta: number, reason: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const updateField = location === 'Warehouse' ? 'qty_warehouse' : 'qty_office';
    const currentQty = location === 'Warehouse' ? product.qtyWarehouse : product.qtyOffice;
    const newQty = currentQty + delta;

    const { error } = await supabase
      .from('products')
      .update({ [updateField]: newQty })
      .eq('id', productId);

    if (!error) {
      const updatedProduct = {
        ...product,
        qtyWarehouse: location === 'Warehouse' ? newQty : product.qtyWarehouse,
        qtyOffice: location === 'Main Office' ? newQty : product.qtyOffice
      };
      setProducts(prev => prev.map(p => p.id === productId ? updatedProduct : p));
      logAction(delta > 0 ? 'ADD' : 'REMOVE', product.name, `${reason} (${delta})`);
    }
  };

  const transferStock = async (productId: string, from: Location, to: Location, amount: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const fromQty = from === 'Warehouse' ? product.qtyWarehouse : product.qtyOffice;
    const toQty = to === 'Warehouse' ? product.qtyWarehouse : product.qtyOffice;

    const updatePayload = {
      qty_warehouse: from === 'Warehouse' ? fromQty - amount : toQty + amount,
      qty_office: from === 'Main Office' ? fromQty - amount : toQty + amount,
    };

    const { error } = await supabase
      .from('products')
      .update(updatePayload)
      .eq('id', productId);

    if (!error) {
      const updatedProduct = {
        ...product,
        qtyWarehouse: updatePayload.qty_warehouse,
        qtyOffice: updatePayload.qty_office
      };
      setProducts(prev => prev.map(p => p.id === productId ? updatedProduct : p));
      logAction('TRANSFER', product.name, `Moved ${amount} ${product.unit} to ${to}`);
    }
  };

  const addSupplier = async (supplier: Supplier) => {
    const { data, error } = await supabase.from('suppliers').insert({
      company_name: supplier.companyName,
      contact_name: supplier.contactName,
      email: supplier.email,
      phone: supplier.phone
    }).select().single();
    if (data && !error) {
      setSuppliers(prev => [...prev, { ...supplier, id: data.id }]);
    }
  };

  const updateSupplier = async (supplier: Supplier) => {
    const { error } = await supabase.from('suppliers').update({
      company_name: supplier.companyName,
      contact_name: supplier.contactName,
      email: supplier.email,
      phone: supplier.phone
    }).eq('id', supplier.id);
    if (!error) {
      setSuppliers(prev => prev.map(s => s.id === supplier.id ? supplier : s));
    }
  };

  const deleteSupplier = async (id: string) => {
    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    if (!error) {
      setSuppliers(prev => prev.filter(s => s.id !== id));
    }
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    if (!error) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    }
  };

  const setExpiryThreshold = async (days: number) => {
    const { error } = await supabase.from('app_settings').upsert({ key: 'expiry_threshold', value: days });
    if (!error) {
      setExpiryThresholdState(days);
      checkNotifications(products, days);
    }
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const login = async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
  };

  const signup = async (email: string, pass: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: { data: { full_name: name } }
    });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    clearData();
  };

  return (
    <InventoryContext.Provider value={{
      currentUser, users, products, suppliers, invoices, logs, notifications, expiryThreshold,
      login, signup, logout, updateUserRole, setExpiryThreshold,
      addProduct, updateProduct, deleteProduct,
      addSupplier, updateSupplier, deleteSupplier,
      addInvoice, deleteInvoice,
      adjustStock, transferStock, markNotificationRead,
      loading, error
    }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) throw new Error("useInventory must be used within InventoryProvider");
  return context;
};