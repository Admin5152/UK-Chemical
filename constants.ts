import { Product, User } from './types';

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Sarah Jenkins', email: 'manager@ukchem.com', role: 'MANAGER' },
  { id: 'u2', name: 'David Smith', email: 'staff@ukchem.com', role: 'STAFF' },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Sulfuric Acid (98%)',
    category: 'Acids',
    unit: 'Liters',
    qtyWarehouse: 500,
    qtyOffice: 20,
    reorderLevel: 100,
    productionDate: '2023-10-01',
    expirationDate: '2025-10-01',
    origin: 'Germany',
    deliveryAgent: 'ChemTrans Logistics',
    price: 45.00,
    supplier: 'BASF'
  },
  {
    id: 'p2',
    name: 'Acetone Industrial',
    category: 'Solvents',
    unit: 'Liters',
    qtyWarehouse: 120,
    qtyOffice: 5,
    reorderLevel: 150, // Low stock!
    productionDate: '2024-01-15',
    expirationDate: '2026-01-15',
    origin: 'UK',
    deliveryAgent: 'UK Fast Freight',
    price: 12.50,
    supplier: 'Ineos'
  },
  {
    id: 'p3',
    name: 'Sodium Hydroxide Pellets',
    category: 'Bases',
    unit: 'Kg',
    qtyWarehouse: 800,
    qtyOffice: 50,
    reorderLevel: 200,
    productionDate: '2023-12-01',
    expirationDate: '2025-06-01',
    origin: 'China',
    deliveryAgent: 'Global Shipping Co',
    price: 8.00,
    supplier: 'SinoChem'
  },
  {
    id: 'p4',
    name: 'Ethanol (Absolute)',
    category: 'Solvents',
    unit: 'Liters',
    qtyWarehouse: 40,
    qtyOffice: 2,
    reorderLevel: 60, // Very low!
    productionDate: '2023-08-01',
    expirationDate: '2023-11-30', // Expired!
    origin: 'France',
    deliveryAgent: 'EuroCargo',
    price: 22.00,
    supplier: 'TotalEnergies'
  },
  {
    id: 'p5',
    name: 'Hydrogen Peroxide (30%)',
    category: 'Oxidizers',
    unit: 'Liters',
    qtyWarehouse: 300,
    qtyOffice: 10,
    reorderLevel: 50,
    productionDate: '2024-02-10',
    expirationDate: '2024-08-10',
    origin: 'UK',
    deliveryAgent: 'UK Fast Freight',
    price: 18.50,
    supplier: 'Solvay'
  }
];

export const CATEGORIES = ['Acids', 'Bases', 'Solvents', 'Oxidizers', 'Salts', 'Polymers', 'Others'];
