
export type UserRole = 'MANAGER' | 'STAFF';

export type Location = 'Warehouse' | 'Main Office';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  unit: string;
  qtyWarehouse: number;
  qtyOffice: number;
  reorderLevel: number;
  productionDate: string;
  expirationDate: string;
  origin: string;
  deliveryAgent: string;
  price: number;
  supplier: string;
}

export interface Supplier {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
}

export interface LogEntry {
  id: string;
  date: string;
  action: 'ADD' | 'REMOVE' | 'TRANSFER' | 'CREATE' | 'UPDATE' | 'DELETE';
  productName: string;
  details: string;
  performedBy: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'WARNING' | 'DANGER' | 'INFO';
  date: string;
  isRead: boolean;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerAddress: string;
  customerContact: string;
  date: string;
  items: InvoiceItem[];
  totalAmount: number;
}

export interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  tin: string;
  logoUrl?: string;
  terms?: string;
}

export interface FilterState {
  search: string;
  category: string;
  location: 'ALL' | Location;
  stockStatus: 'ALL' | 'LOW' | 'NORMAL' | 'EXPIRED';
}
