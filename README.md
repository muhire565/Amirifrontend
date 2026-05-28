# Amiri's Food Restaurant — POS Frontend

A production-grade React frontend for the Amiri's Food Restaurant POS system.

## Tech Stack
- **React 18 + Vite**
- **Tailwind CSS** (Styling)
- **Zustand** (Auth State Management)
- **React Query** (Server State Management)
- **React Router v6** (Navigation)
- **React Hook Form + Zod** (Forms & Validation)
- **Lucide React** (Icons)

## Getting Started

1. **Clone the repository** (if not already done)
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Set up environment variables**:
   Create a `.env` file in the root directory:
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   ```
4. **Run the development server**:
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000` (or the port specified in `vite.config.js`).

## Project Features
- **Auth System**: Email/Password login and 4-digit PIN login for POS tablets.
- **Role-Based Access Control (RBAC)**: Different views and actions for Owners, Managers, Cashiers, Waiters, Chefs, and Drivers.
- **Staff Management**: Full CRUD operations for managing employees (Owner/Manager only).
- **Responsive Design**: Optimized for both desktop management and tablet POS use.
- **Real-time Notifications**: Instant feedback on actions via React Hot Toast.

## Role Permissions
- **Owner**: Full system access (All branches, staff management, reports).
- **Manager**: Branch-level management access.
- **Cashier/Waiter/Chef/Driver**: Dashboard access and functional role-specific views (coming soon).
