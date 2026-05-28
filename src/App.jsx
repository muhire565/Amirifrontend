import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Layouts
import AppShell from './components/layout/AppShell';

// Guards
import PrivateRoute from './components/guards/PrivateRoute';
import RoleGuard from './components/guards/RoleGuard';

// Pages
import LoginPage from './pages/auth/LoginPage';
import PinLoginPage from './pages/auth/PinLoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import StaffListPage from './pages/staff/StaffListPage';
import StaffDetailPage from './pages/staff/StaffDetailPage';
import CreateStaffPage from './pages/staff/CreateStaffPage';
import EditStaffPage from './pages/staff/EditStaffPage';

// New Pages
import MenuPage from './pages/menu/MenuPage';
import MenuManagePage from './pages/menu/MenuManagePage';
import TablesPage from './pages/tables/TablesPage';
import TableManagePage from './pages/tables/TableManagePage';
import OrdersPage from './pages/orders/OrdersPage';
import CreateOrderPage from './pages/orders/CreateOrderPage';
import OrderDetailPage from './pages/orders/OrderDetailPage';
import KDSPage from './pages/kds/KDSPage';
import BillingPage from './pages/billing/BillingPage';
import PaymentPage from './pages/payments/PaymentPage';
import PaymentsReportPage from './pages/payments/PaymentsReportPage';
import BranchListPage from './pages/branches/BranchListPage';
import CreateBranchPage from './pages/branches/CreateBranchPage';

// Inventory Pages
import InventoryPage from './pages/inventory/InventoryPage';
import RestockPage from './pages/inventory/RestockPage';
import WastagePage from './pages/inventory/WastagePage';
import IngredientsMapPage from './pages/inventory/IngredientsMapPage';
import InventoryAuditPage from './pages/inventory/InventoryAuditPage';

// Delivery Pages
import DeliveryPage from './pages/delivery/DeliveryPage';
import CreateDeliveryPage from './pages/delivery/CreateDeliveryPage';
import DeliveryDetailPage from './pages/delivery/DeliveryDetailPage';
import RidersPage from './pages/delivery/RidersPage';

// Dashboard & Reporting Pages
import OwnerDashboardPage from './pages/dashboard/OwnerDashboardPage';
import RevenueReportPage from './pages/dashboard/RevenueReportPage';
import StaffReportPage from './pages/dashboard/StaffReportPage';
import InventoryReportPage from './pages/dashboard/InventoryReportPage';
import MenuReportPage from './pages/dashboard/MenuReportPage';
import DeliveryReportPage from './pages/dashboard/DeliveryReportPage';
import BeverageReportPage from './pages/dashboard/BeverageReportPage';
import BranchComparePage from './pages/dashboard/BranchComparePage';
import CashReconciliationPage from './pages/dashboard/CashReconciliationPage';
import ExpensesPage from './pages/dashboard/ExpensesPage';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

const router = createBrowserRouter([
  // Public Routes
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/pin',
    element: <PinLoginPage />,
  },

  // Full Screen KDS (Chef only)
  {
    path: '/kds',
    element: (
      <PrivateRoute>
        <RoleGuard allowedRoles={['chef', 'owner', 'manager']}>
          <KDSPage />
        </RoleGuard>
      </PrivateRoute>
    ),
  },

  // Protected Routes with AppShell
  {
    path: '/',
    element: <PrivateRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          {
            path: '',
            element: <Navigate to="/dashboard" replace />,
          },
          {
            path: 'dashboard',
            element: <DashboardPage />,
          },
          {
            path: 'dashboard/owner',
            element: <RoleGuard allowedRoles={['owner']}><OwnerDashboardPage /></RoleGuard>,
          },
          // Staff
          {
            path: 'staff',
            element: <RoleGuard allowedRoles={['owner', 'manager']} />,
            children: [
              { path: '', element: <StaffListPage /> },
              { path: 'new', element: <RoleGuard allowedRoles={['owner']} children={<CreateStaffPage />} /> },
              { path: ':id', element: <StaffDetailPage /> },
              { path: ':id/edit', element: <RoleGuard allowedRoles={['owner']} children={<EditStaffPage />} /> },
            ],
          },
          // Branches
          {
            path: 'branches',
            element: <RoleGuard allowedRoles={['owner']}><BranchListPage /></RoleGuard>,
          },
          {
            path: 'branches/new',
            element: <RoleGuard allowedRoles={['owner']}><CreateBranchPage /></RoleGuard>,
          },
          {
            path: 'branches/:id/edit',
            element: <RoleGuard allowedRoles={['owner']}><CreateBranchPage /></RoleGuard>,
          },
          // Menu
          {
            path: 'menu',
            element: <RoleGuard allowedRoles={['owner', 'manager']}><MenuPage /></RoleGuard>,
          },
          {
            path: 'menu/manage',
            element: <RoleGuard allowedRoles={['owner', 'manager']}><MenuManagePage /></RoleGuard>,
          },
          // Tables
          {
            path: 'tables',
            element: (
              <RoleGuard allowedRoles={['owner', 'manager', 'cashier', 'waiter']}>
                <TablesPage />
              </RoleGuard>
            ),
          },
          {
            path: 'tables/manage',
            element: (
              <RoleGuard allowedRoles={['owner', 'manager']}>
                <TableManagePage />
              </RoleGuard>
            ),
          },
          // Orders
          {
            path: 'orders',
            children: [
              { 
                path: '', 
                element: (
                  <RoleGuard allowedRoles={['owner', 'manager', 'cashier', 'waiter']}>
                    <OrdersPage />
                  </RoleGuard>
                ),
              },
              { 
                path: 'new', 
                element: (
                  <RoleGuard allowedRoles={['cashier']}>
                    <CreateOrderPage />
                  </RoleGuard>
                ),
              },
              { 
                path: ':id', 
                element: (
                  <RoleGuard allowedRoles={['owner', 'manager', 'cashier', 'waiter']}>
                    <OrderDetailPage />
                  </RoleGuard>
                ),
              },
            ],
          },
          // Inventory
          {
            path: 'inventory',
            children: [
              { path: '', element: <RoleGuard allowedRoles={['owner', 'manager', 'cashier', 'chef']}><InventoryPage /></RoleGuard> },
              { path: 'restock', element: <RoleGuard allowedRoles={['owner', 'manager']}><RestockPage /></RoleGuard> },
              { path: 'wastage', element: <RoleGuard allowedRoles={['owner', 'manager', 'chef']}><WastagePage /></RoleGuard> },
              { path: 'ingredients', element: <RoleGuard allowedRoles={['owner', 'manager']}><IngredientsMapPage /></RoleGuard> },
              { path: 'audit', element: <RoleGuard allowedRoles={['owner', 'manager']}><InventoryAuditPage /></RoleGuard> },
            ]
          },
          // Delivery
          {
            path: 'delivery',
            children: [
              { path: '', element: <RoleGuard allowedRoles={['owner', 'manager', 'cashier']}><DeliveryPage /></RoleGuard> },
              { path: 'new', element: <RoleGuard allowedRoles={['cashier']}><CreateDeliveryPage /></RoleGuard> },
              { path: ':id', element: <RoleGuard allowedRoles={['owner', 'manager', 'cashier']}><DeliveryDetailPage /></RoleGuard> },
              { path: 'riders', element: <RoleGuard allowedRoles={['owner', 'manager', 'cashier']}><RidersPage /></RoleGuard> },
            ]
          },
          // Expenses
          {
            path: 'expenses',
            element: <RoleGuard allowedRoles={['owner', 'manager']}><ExpensesPage /></RoleGuard>,
          },
          // Reports
          {
            path: 'reports',
            children: [
              { path: 'revenue', element: <RoleGuard allowedRoles={['owner', 'manager']}><RevenueReportPage /></RoleGuard> },
              { path: 'staff', element: <RoleGuard allowedRoles={['owner', 'manager']}><StaffReportPage /></RoleGuard> },
              { path: 'inventory', element: <RoleGuard allowedRoles={['owner', 'manager']}><InventoryReportPage /></RoleGuard> },
              { path: 'menu', element: <RoleGuard allowedRoles={['owner', 'manager']}><MenuReportPage /></RoleGuard> },
              { path: 'delivery', element: <RoleGuard allowedRoles={['owner', 'manager']}><DeliveryReportPage /></RoleGuard> },
              { path: 'beverages', element: <RoleGuard allowedRoles={['owner', 'manager']}><BeverageReportPage /></RoleGuard> },
              { path: 'branches', element: <RoleGuard allowedRoles={['owner']}><BranchComparePage /></RoleGuard> },
              { path: 'cash', element: <RoleGuard allowedRoles={['owner', 'manager', 'cashier']}><CashReconciliationPage /></RoleGuard> },
            ]
          },
          // Billing & Payments
          {
            path: 'billing/:order_id',
            element: (
              <RoleGuard allowedRoles={['cashier']}>
                <BillingPage />
              </RoleGuard>
            ),
          },
          {
            path: 'payments/new/:bill_id',
            element: (
              <RoleGuard allowedRoles={['cashier']}>
                <PaymentPage />
              </RoleGuard>
            ),
          },
          {
            path: 'payments/report',
            element: (
              <RoleGuard allowedRoles={['owner', 'manager']}>
                <PaymentsReportPage />
              </RoleGuard>
            ),
          },
        ],
      },
    ],
  },
  
  // Catch-all
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);

import { useEffect } from 'react';
import { initAudio } from './utils/sound';

export default function App() {
  useEffect(() => {
    const handleFirstInteraction = () => {
      initAudio();
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };
    window.addEventListener('click', handleFirstInteraction);
    window.addEventListener('keydown', handleFirstInteraction);
    window.addEventListener('touchstart', handleFirstInteraction);
    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { background: '#0f172a', color: '#fff', borderRadius: '12px' },
          success: { iconTheme: { primary: '#f59e0b', secondary: '#fff' } },
        }}
      />
    </QueryClientProvider>
  );
}
