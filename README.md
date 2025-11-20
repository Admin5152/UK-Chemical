# UK Chemicals Inventory System

A professional, web-based inventory management system designed for UK Chemicals to track stock across multiple locations (Warehouse & Main Office).

## 🚀 Features

- **Multi-Location Tracking:** Monitor stock levels in Warehouse vs. Main Office.
- **Role-Based Access:** 
  - **Managers:** Full control (Add/Edit/Delete products, Users, Settings).
  - **Staff:** View inventory, transfer stock, view reports.
- **Real-time Invoicing:** Generate professional PDF invoices with automatic number-to-words conversion.
- **Supplier Management:** Track vendor details and contacts.
- **Smart Alerts:** Automated notifications for Low Stock and Expiring Products.
- **Reporting:** Visual charts for stock distribution and expiry analysis.
- **Printable Views:** Optimized CSS for printing invoices and reports.

## 🛠️ Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, Real-time)
- **Icons:** Lucide React
- **Charts:** Recharts
- **PDF Generation:** html2pdf.js

## 📦 Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/ukchem-inventory.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```

## 🔐 Credentials

This project uses Supabase for authentication. 
- **Manager Login:** (Configured in backend)
- **Staff Login:** Create a new account via the Signup page.

---
© 2025 UK Chemicals Ltd.
