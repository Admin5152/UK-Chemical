import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { Product, LogEntry, User, Notification, Location, UserRole, Supplier, Invoice, CompanyInfo } from '../types';
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
  companyInfo: CompanyInfo;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserRole: (userId: string, newRole: UserRole) => Promise<void>;
  setExpiryThreshold: (days: number) => Promise<void>;
  updateCompanyInfo: (info: CompanyInfo) => Promise<void>;
  addProduct: (product: Product) => Promise<boolean>;
  updateProduct: (product: Product) => Promise<boolean>;
  deleteProduct: (id: string) => Promise<boolean>;
  addSupplier: (supplier: Supplier) => Promise<boolean>;
  updateSupplier: (supplier: Supplier) => Promise<boolean>;
  deleteSupplier: (id: string) => Promise<boolean>;
  addInvoice: (invoice: Omit<Invoice, 'id'>) => Promise<boolean>;
  updateInvoice: (invoice: Invoice) => Promise<boolean>;
  deleteInvoice: (id: string) => Promise<boolean>;
  adjustStock: (productId: string, location: Location, delta: number, reason: string) => Promise<void>;
  transferStock: (productId: string, from: Location, to: Location, amount: number) => Promise<void>;
  markNotificationRead: (id: string) => void;
  loading: boolean;
  error: string | null;
  clearData: () => void;
  dbHealth: { invoices: boolean; products: boolean };
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
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: 'UK Chemicals',
    address: 'Head Office, Kumasi, Ghana',
    phone: '+233 24 220 3228',
    email: 'sagyeimensah@yahoo.com',
    tin: 'C001234567',
    terms: '1. Goods once sold will not be taken back.\n2. Interest @ 24% p.a. will be charged if bill is not paid within 30 days.'
  });
  
  // DB Health Check
  const [dbHealth, setDbHealth] = useState({ invoices: true, products: true });

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

  // Helper to check missing table errors
  const isMissingTableError = (err: any) => {
    return err?.code === '42P01' || 
           err?.message?.includes('Could not find the table') || 
           err?.message?.includes('relation "public.invoices" does not exist');
  };

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

    // Realtime Subscription to sync data across devices
    const channel = supabase.channel('public:db_changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        // When any data changes in the DB, refresh our local data
        if (currentUserIdRef.current) {
          fetchAllData();
        }
      })
      .subscribe();

    return () => { 
      mounted = false; 
      supabase.removeChannel(channel);
    };
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
        // Try to create profile
        try {
           await supabase.from('profiles').insert(newProfile).select().single();
        } catch(e) { console.warn("Profile creation failed", e); }
        profile = newProfile;
      }

      if (isSuperAdmin) {
        profile.role = 'MANAGER';
        // Force sync role to DB
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
      // Independent fetches to prevent one failure (like network issue) from crashing the whole app
      const productsPromise = supabase.from('products').select('*')
        .then(res => ({ ...res, type: 'products' }))
        .catch(err => ({ data: null, error: err, type: 'products' }));

      const suppliersPromise = supabase.from('suppliers').select('*')
        .then(res => ({ ...res, type: 'suppliers' }))
        .catch(err => ({ data: null, error: err, type: 'suppliers' }));

      const logsPromise = supabase.from('logs').select('*').order('created_at', { ascending: false }).limit(50)
        .then(res => ({ ...res, type: 'logs' }))
        .catch(err => ({ data: null, error: err, type: 'logs' }));

      const usersPromise = supabase.from('profiles').select('*')
        .then(res => ({ ...res, type: 'users' }))
        .catch(err => ({ data: null, error: err, type: 'users' }));

      const settingsPromise = supabase.from('app_settings').select('*').eq('key', 'expiry_threshold').single()
        .then(res => ({ ...res, type: 'settings' }))
        .catch(err => ({ data: null, error: err, type: 'settings' }));

      const invoicesPromise = supabase.from('invoices').select('*').order('created_at', { ascending: false })
        .then(res => ({ ...res, type: 'invoices' }))
        .catch(err => ({ data: null, error: err, type: 'invoices' }));

      const companyPromise = supabase.from('app_settings').select('*').eq('key', 'company_info').single()
        .then(res => ({ ...res, type: 'company' }))
        .catch(err => ({ data: null, error: err, type: 'company' }));

      const [productsRes, suppliersRes, logsRes, usersRes, settingsRes, invoicesRes, companyRes] = await Promise.all([
        productsPromise, suppliersPromise, logsPromise, usersPromise, settingsPromise, invoicesPromise, companyPromise
      ]);

      if (productsRes.data) {
        const formattedProducts = productsRes.data.map((p: any) => ({
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
        setDbHealth(prev => ({ ...prev, products: true }));
      } else if (isMissingTableError(productsRes.error)) {
        setDbHealth(prev => ({ ...prev, products: false }));
      }

      if (suppliersRes.data) {
        setSuppliers(suppliersRes.data.map((s: any) => ({
          id: s.id,
          companyName: s.company_name,
          contactName: s.contact_name,
          email: s.email,
          phone: s.phone
        })));
      }

      if (invoicesRes.data) {
        const fetchedInvoices = invoicesRes.data.map((i: any) => ({
          id: i.id,
          invoiceNumber: i.invoice_number,
          customerName: i.customer_name,
          customerAddress: i.customer_address,
          customerContact: i.customer_contact,
          date: i.date,
          items: Array.isArray(i.items) ? i.items : [], 
          totalAmount: Number(i.total_amount)
        }));
        fetchedInvoices.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setInvoices(fetchedInvoices);
        setDbHealth(prev => ({ ...prev, invoices: true }));
      } else if (invoicesRes.error) {
        if (isMissingTableError(invoicesRes.error)) {
          console.warn("Invoices table missing.");
          setDbHealth(prev => ({ ...prev, invoices: false }));
        } else {
          console.error("Invoices fetch failed:", invoicesRes.error.message);
        }
      }

      if (logsRes.data) {
        setLogs(logsRes.data.map((l: any) => ({
          id: l.id,
          date: l.created_at,
          action: l.action,
          productName: l.product_name,
          details: l.details,
          performedBy: l.performed_by
        })));
      }

      if (usersRes.data) {
        setUsers(usersRes.data.map((u: any) => ({
          id: u.id,
          name: u.full_name,
          email: u.email,
          role: u.role as UserRole
        })));
      }
      
      if (settingsRes.data) {
        setExpiryThresholdState(Number(settingsRes.data.value));
      }

      if (companyRes.data) {
        setCompanyInfo(prev => ({ ...prev, ...companyRes.data.value }));
      }

    } catch (error: any) {
      console.error("Error fetching data:", error.message || error);
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
    
    await supabase.from('logs').insert(newLog);
  };

  const addProduct = async (product: Product): Promise<boolean> => {
    if (currentUser?.role !== 'MANAGER') {
      alert("Only Managers can add products.");
      return false;
    }
    
    const dbProduct = {
      name: product.name,
      category: product.category,
      unit: product.unit,
      qty_warehouse: product.qtyWarehouse,
      qty_office: product.qtyOffice,
      reorder_level: product.reorderLevel,
      production_date: product.productionDate || null,
      expiration_date: product.expirationDate || null,
      origin: product.origin,
      delivery_agent: product.deliveryAgent,
      price: product.price,
      supplier: product.supplier
    };

    const { data, error } = await supabase.from('products').insert(dbProduct).select().single();
    
    if (error) {
      alert("Failed to add product: " + error.message);
      return false;
    }
    
    if (data) {
      const newProduct = {
        ...product,
        id: data.id // Use the actual UUID from DB
      };
      logAction('CREATE', product.name, 'Added new product');
      setProducts(prev => [...prev, newProduct]);
      return true;
    }
    return false;
  };

  const updateProduct = async (product: Product): Promise<boolean> => {
    if (currentUser?.role !== 'MANAGER') {
      alert("Only Managers can update products.");
      return false;
    }

    const dbProduct = {
      name: product.name,
      category: product.category,
      unit: product.unit,
      qty_warehouse: product.qtyWarehouse,
      qty_office: product.qtyOffice,
      reorder_level: product.reorderLevel,
      production_date: product.productionDate || null,
      expiration_date: product.expirationDate || null,
      origin: product.origin,
      delivery_agent: product.deliveryAgent,
      price: product.price,
      supplier: product.supplier
    };

    const { error } = await supabase.from('products').update(dbProduct).eq('id', product.id);

    if (error) {
      alert("Failed to update product: " + error.message);
      return false;
    }

    logAction('UPDATE', product.name, 'Updated details');
    setProducts(prev => prev.map(p => p.id === product.id ? product : p));
    return true;
  };

  const deleteProduct = async (id: string): Promise<boolean> => {
    if (currentUser?.role !== 'MANAGER') {
      alert("Only Managers can delete products.");
      return false;
    }
    
    const pName = products.find(p => p.id === id)?.name || 'Product';
    const { error } = await supabase.from('products').delete().eq('id', id);
    
    if (error) {
      alert("Failed to delete product: " + error.message);
      return false;
    }

    logAction('DELETE', pName, 'Deleted product');
    setProducts(prev => prev.filter(p => p.id !== id));
    return true;
  };

  // --- STRICT INVOICE ACTIONS (No Local Fallback) ---

  const addInvoice = async (invoiceData: Omit<Invoice, 'id'>): Promise<boolean> => {
    if (currentUser?.role !== 'MANAGER') {
      alert("Only Managers can create invoices.");
      return false;
    }

    // Safe User ID check (Validation for UUID format)
    // If user ID is not a valid UUID (e.g. legacy/local user), send NULL to avoid db crash
    const isValidUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const creatorId = (currentUser?.id && isValidUUID(currentUser.id)) ? currentUser.id : null;

    const dbInvoice = {
      invoice_number: invoiceData.invoiceNumber,
      customer_name: invoiceData.customerName,
      customer_address: invoiceData.customerAddress,
      customer_contact: invoiceData.customerContact,
      date: invoiceData.date,
      items: invoiceData.items,
      total_amount: invoiceData.totalAmount,
      created_by: creatorId
    };

    const { data, error } = await supabase.from('invoices').insert(dbInvoice).select().single();
    
    if (error) {
      if (isMissingTableError(error)) {
        alert("Error: The 'invoices' table does not exist. Go to Settings -> Database Diagnostics to fix this.");
      } else {
        alert("Failed to save invoice: " + error.message);
      }
      return false;
    }

    if (data) {
      const newInv: Invoice = {
        id: data.id,
        invoiceNumber: data.invoice_number,
        customerName: data.customer_name,
        customerAddress: data.customer_address,
        customerContact: data.customer_contact,
        date: data.date,
        items: data.items,
        totalAmount: data.total_amount
      };
      setInvoices(prev => [newInv, ...prev]);
      logAction('CREATE', `Invoice ${invoiceData.invoiceNumber}`, `Created invoice`);
      return true;
    }
    return false;
  };

  const updateInvoice = async (invoice: Invoice): Promise<boolean> => {
    if (currentUser?.role !== 'MANAGER') {
      alert("Only Managers can update invoices.");
      return false;
    }

    const dbInvoice = {
      invoice_number: invoice.invoiceNumber,
      customer_name: invoice.customerName,
      customer_address: invoice.customerAddress,
      customer_contact: invoice.customerContact,
      date: invoice.date,
      items: invoice.items,
      total_amount: invoice.totalAmount
    };

    const { error } = await supabase.from('invoices').update(dbInvoice).eq('id', invoice.id);

    if (error) {
      alert("Failed to update invoice: " + error.message);
      return false;
    }

    setInvoices(prev => prev.map(i => i.id === invoice.id ? invoice : i));
    logAction('UPDATE', `Invoice ${invoice.invoiceNumber}`, `Updated invoice`);
    return true;
  };

  const deleteInvoice = async (id: string): Promise<boolean> => {
    if (currentUser?.role !== 'MANAGER') {
      alert("Only Managers can delete invoices.");
      return false;
    }
    
    const { error } = await supabase.from('invoices').delete().eq('id', id);
    
    if (error) {
      alert("Failed to delete invoice: " + error.message);
      return false;
    }
    
    setInvoices(prev => prev.filter(i => i.id !== id));
    return true;
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

    if (error) {
      alert("Failed to adjust stock: " + error.message);
      return;
    }

    logAction(delta > 0 ? 'ADD' : 'REMOVE', product.name, `${reason} (${delta})`);
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

    if (error) {
      alert("Failed to transfer stock: " + error.message);
      return;
    }

    logAction('TRANSFER', product.name, `Moved ${amount} ${product.unit} to ${to}`);
  };

  const addSupplier = async (supplier: Supplier): Promise<boolean> => {
    const { data, error } = await supabase.from('suppliers').insert({
      company_name: supplier.companyName,
      contact_name: supplier.contactName,
      email: supplier.email,
      phone: supplier.phone
    }).select().single();
    
    if (error) {
      alert("Failed to add supplier: " + error.message);
      return false;
    }
    
    if (data) {
        const newSupplier = { ...supplier, id: data.id };
        setSuppliers(prev => [...prev, newSupplier]);
        return true;
    }
    return false;
  };

  const updateSupplier = async (supplier: Supplier): Promise<boolean> => {
    const { error } = await supabase.from('suppliers').update({
      company_name: supplier.companyName,
      contact_name: supplier.contactName,
      email: supplier.email,
      phone: supplier.phone
    }).eq('id', supplier.id);
    
    if (error) {
      alert("Failed to update supplier: " + error.message);
      return false;
    }
    setSuppliers(prev => prev.map(s => s.id === supplier.id ? supplier : s));
    return true;
  };

  const deleteSupplier = async (id: string): Promise<boolean> => {
    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    if (error) {
      alert("Failed to delete supplier: " + error.message);
      return false;
    }
    setSuppliers(prev => prev.filter(s => s.id !== id));
    return true;
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    if (error) {
      alert("Failed to update role: " + error.message);
      return;
    }
  };

  const setExpiryThreshold = async (days: number) => {
    const { error } = await supabase.from('app_settings').upsert({ key: 'expiry_threshold', value: days });
    if (!error) {
      setExpiryThresholdState(days);
      checkNotifications(products, days);
    }
  };

  const updateCompanyInfo = async (info: CompanyInfo) => {
    const { error } = await supabase.from('app_settings').upsert({ key: 'company_info', value: info });
    if (error) {
      alert("Failed to save settings: " + error.message);
      return;
    }
    setCompanyInfo(info);
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
    try {
      clearData();
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("Sign out error", e);
    } finally {
      window.location.reload();
    }
  };

  return (
    <InventoryContext.Provider value={{
      currentUser, users, products, suppliers, invoices, logs, notifications, expiryThreshold, companyInfo,
      login, signup, logout, updateUserRole, setExpiryThreshold, updateCompanyInfo,
      addProduct, updateProduct, deleteProduct,
      addSupplier, updateSupplier, deleteSupplier,
      addInvoice, updateInvoice, deleteInvoice,
      adjustStock, transferStock, markNotificationRead,
      loading, error, clearData, dbHealth
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