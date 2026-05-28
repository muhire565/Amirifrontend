import { useQuery } from '@tanstack/react-query';
import {
  Users, Store, ArrowRight, UserCircle, ShieldCheck,
  Calendar, Plus, Grid, Receipt, Bike, Wallet, UtensilsCrossed,
  Hash
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from '../../store/auth.store';
import { getMe } from '../../api/auth.api';
import { getStaff } from '../../api/staff.api';
import { getBranches } from '../../api/branches.api';
import { getTables } from '../../api/tables.api';
import { getOrders } from '../../api/orders.api';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import { formatUGX } from '../../utils/currency';
import clsx from 'clsx';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === 'chef') {
      navigate('/kds', { replace: true });
    } else if (user?.role === 'owner') {
      navigate('/dashboard/owner', { replace: true });
    }
  }, [user, navigate]);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
  });

  const { data: staffData, isLoading: staffLoading } = useQuery({
    queryKey: ['staff-summary'],
    queryFn: () => getStaff(),
    enabled: ['owner', 'manager'].includes(user?.role),
  });

  const { data: branchData, isLoading: branchLoading } = useQuery({
    queryKey: ['branches-summary'],
    queryFn: getBranches,
    enabled: user?.role === 'owner',
  });

  // Cashier/Waiter live data
  const { data: tablesResponse } = useQuery({
    queryKey: ['tables', user?.branch_id],
    queryFn: () => getTables({ branch_id: user?.branch_id }),
    enabled: ['cashier', 'waiter'].includes(user?.role),
    refetchInterval: 15000,
  });

  const { data: ordersResponse } = useQuery({
    queryKey: ['orders', user?.branch_id],
    queryFn: () => getOrders({ branch_id: user?.branch_id, status: 'pending,confirmed,preparing,ready,served,billed', limit: 10 }),
    enabled: ['cashier', 'waiter', 'manager'].includes(user?.role),
    refetchInterval: 15000,
  });

  if (profileLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const tables = tablesResponse?.tables || [];
  const orders = ordersResponse?.orders || [];
  const occupiedTables = tables.filter(t => t.status === 'occupied');
  const availableTables = tables.filter(t => t.status === 'available');

  // Cashier/Waiter quick actions
  const quickActions = [
    {
      label: 'New Order',
      sub: 'Start a new sale',
      icon: Plus,
      color: 'from-emerald-400 to-emerald-600',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      to: '/orders/new',
      roles: ['cashier'],
    },
    {
      label: 'Floor Plan',
      sub: `${occupiedTables.length} occupied, ${availableTables.length} free`,
      icon: Grid,
      color: 'from-indigo-400 to-violet-600',
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
      to: '/tables',
      roles: ['cashier', 'waiter'],
    },
    {
      label: 'Active Orders',
      sub: `${orders.length} order${orders.length !== 1 ? 's' : ''} in progress`,
      icon: Receipt,
      color: 'from-amber-400 to-orange-500',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      to: '/orders',
      roles: ['cashier', 'waiter', 'manager'],
    },
    {
      label: 'Cash & Expenses',
      sub: 'Reconcile & record',
      icon: Wallet,
      color: 'from-slate-600 to-slate-800',
      bg: 'bg-slate-50',
      text: 'text-slate-700',
      to: '/reports/cash',
      roles: ['cashier', 'manager'],
    },
    {
      label: 'Delivery',
      sub: 'New delivery order',
      icon: Bike,
      color: 'from-blue-400 to-blue-600',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      to: '/delivery/new',
      roles: ['cashier'],
    },
  ];

  const visibleActions = quickActions.filter(a => a.roles.includes(user?.role));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {getTimeOfDay()}, {user?.full_name?.split(' ')[0]}
          </h1>
          <div className="flex items-center gap-2 mt-1.5 text-slate-400 font-medium">
            <Calendar size={14} />
            <span className="text-[12px]">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-white p-1.5 pr-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white">
            <ShieldCheck size={22} />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-tight">System Status</p>
            <p className="text-[12px] font-black text-emerald-600">Secure & Online</p>
          </div>
        </div>
      </div>

      {/* ── CASHIER / WAITER / DRIVER DASHBOARD ── */}
      {['cashier', 'waiter', 'driver'].includes(user?.role) && (
        <>
          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {visibleActions.map((action) => (
              <Link
                key={action.label}
                to={action.to}
                className={clsx(
                  "relative p-5 rounded-[20px] border-2 transition-all duration-300 group overflow-hidden",
                  "hover:shadow-xl hover:-translate-y-1"
                )}
                style={{ borderColor: 'transparent' }}
              >
                <div className={clsx("absolute inset-0 opacity-[0.07] rounded-[18px]", action.bg.replace('bg-', 'bg-'))} style={{ background: `linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to))` }} />
                <div className="absolute inset-0 rounded-[18px] border border-slate-100/60" />
                <div className="relative z-10">
                  <div className={clsx(
                    "h-11 w-11 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shadow-lg mb-4",
                    action.color
                  )}>
                    <action.icon size={20} />
                  </div>
                  <h3 className="text-[15px] font-black text-slate-900 leading-tight">{action.label}</h3>
                  <p className="text-[11px] font-bold text-slate-400 mt-1">{action.sub}</p>
                </div>
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight size={16} className="text-slate-300" />
                </div>
              </Link>
            ))}
          </div>

          {/* Live Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              value={tables.length}
              label="Total Tables"
              icon={Grid}
              color="text-indigo-600"
              bg="bg-indigo-50"
            />
            <StatCard
              value={occupiedTables.length}
              label="Occupied"
              icon={UtensilsCrossed}
              color="text-amber-600"
              bg="bg-amber-50"
            />
            <StatCard
              value={availableTables.length}
              label="Available"
              icon={Hash}
              color="text-emerald-600"
              bg="bg-emerald-50"
            />
            <StatCard
              value={orders.length}
              label="Active Orders"
              icon={Receipt}
              color="text-blue-600"
              bg="bg-blue-50"
            />
          </div>

          {/* Two Column: Recent Orders + Active Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Orders */}
            <div className="bg-white rounded-[20px] border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-amber-50 flex items-center justify-center">
                    <Receipt size={16} className="text-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-black text-slate-900">Recent Orders</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Latest active</p>
                  </div>
                </div>
                <Link to="/orders" className="text-[11px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 transition-colors">
                  View All
                </Link>
              </div>
              <div className="divide-y divide-slate-50">
                {orders.slice(0, 5).map((order) => (
                  <Link
                    key={order.id}
                    to={`/orders/${order.id}`}
                    className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50/60 transition-colors"
                  >
                    <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                      <Hash size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-bold text-slate-800 truncate">
                          {order.order_number || `#${order.id?.slice(-6)}`}
                        </p>
                        <span className={clsx(
                          "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full",
                          order.status === 'pending' ? "bg-amber-100 text-amber-700" :
                          order.status === 'preparing' ? "bg-indigo-100 text-indigo-700" :
                          order.status === 'ready' ? "bg-emerald-100 text-emerald-700" :
                          order.status === 'served' ? "bg-blue-100 text-blue-700" :
                          order.status === 'billed' ? "bg-slate-100 text-slate-700" :
                          "bg-slate-100 text-slate-500"
                        )}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                        {order.tables?.table_number ? `Table ${order.tables.table_number}` : order.order_type?.replace('_', ' ')} · {order.waiter?.full_name || 'Staff'}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[14px] font-black text-slate-900">{formatUGX(order.total_amount)}</p>
                    </div>
                  </Link>
                ))}
                {orders.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 opacity-30">
                    <Receipt size={40} className="text-slate-300 mb-2" />
                    <p className="text-[13px] font-bold text-slate-500">No active orders</p>
                  </div>
                )}
              </div>
            </div>

            {/* Active Tables */}
            <div className="bg-white rounded-[20px] border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <Grid size={16} className="text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-black text-slate-900">Table Status</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live floor view</p>
                  </div>
                </div>
                <Link to="/tables" className="text-[11px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 transition-colors">
                  Floor Plan
                </Link>
              </div>
              <div className="p-5 grid grid-cols-3 sm:grid-cols-4 gap-3">
                {tables.map((table) => (
                  <Link
                    key={table.id}
                    to={table.status === 'occupied' && table.active_order_id ? `/orders/${table.active_order_id}` : `/orders/new?table_id=${table.id}&table_number=${table.table_number}`}
                    className={clsx(
                      "flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all hover:shadow-md",
                      table.status === 'available' ? "bg-emerald-50/50 border-emerald-200 hover:border-emerald-400" :
                      table.status === 'occupied' ? "bg-amber-50/50 border-amber-200 hover:border-amber-400" :
                      "bg-blue-50/50 border-blue-200 hover:border-blue-400"
                    )}
                  >
                    <span className={clsx(
                      "text-[11px] font-black uppercase tracking-widest mb-1",
                      table.status === 'available' ? "text-emerald-600" :
                      table.status === 'occupied' ? "text-amber-600" :
                      "text-blue-600"
                    )}>
                      {table.status}
                    </span>
                    <span className="text-2xl font-black text-slate-800">{table.table_number}</span>
                    <span className="text-[10px] font-bold text-slate-400 mt-0.5">
                      {table.seats_occupied || 0}/{table.capacity}
                    </span>
                  </Link>
                ))}
                {tables.length === 0 && (
                  <div className="col-span-full flex flex-col items-center justify-center py-12 opacity-30">
                    <Grid size={40} className="text-slate-300 mb-2" />
                    <p className="text-[13px] font-bold text-slate-500">No tables configured</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── MANAGER DASHBOARD ── */}
      {user?.role === 'manager' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SummaryCard
            icon={Users}
            iconBg="bg-blue-100"
            iconColor="text-blue-600"
            label="Total Staff"
            value={staffLoading ? '...' : (staffData?.count || 0)}
            sub="In your branch"
            to="/staff"
          />
          <SummaryCard
            icon={Grid}
            iconBg="bg-emerald-100"
            iconColor="text-emerald-600"
            label="Active Tables"
            value={tables.length}
            sub={`${occupiedTables.length} occupied`}
            to="/tables"
          />
          <SummaryCard
            icon={Receipt}
            iconBg="bg-amber-100"
            iconColor="text-amber-600"
            label="Active Orders"
            value={orders.length}
            sub="In progress"
            to="/orders"
          />
        </div>
      )}

      {/* ── OWNER DASHBOARD (redirects, but keep as fallback) ── */}
      {(user?.role === 'owner') && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SummaryCard
            icon={Users}
            iconBg="bg-blue-100"
            iconColor="text-blue-600"
            label="Total Staff"
            value={staffLoading ? '...' : (staffData?.count || 0)}
            sub="Across all branches"
            to="/staff"
          />
          <SummaryCard
            icon={Store}
            iconBg="bg-purple-100"
            iconColor="text-purple-600"
            label="Active Branches"
            value={branchLoading ? '...' : (branchData?.count || 0)}
            sub="Uganda locations"
            to="/branches"
          />
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <UserCircle size={32} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Your Profile</h3>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                <span className="text-xs font-medium text-slate-500">Role</span>
                <Badge variant="role">{user?.role}</Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                <span className="text-xs font-medium text-slate-500">Account Status</span>
                <Badge variant="status">Active</Badge>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Owner Quick Actions */}
      {user?.role === 'owner' && (
        <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-2">Management Quick Actions</h2>
            <p className="text-slate-400 mb-6 max-w-md text-sm">
              Efficiently manage your restaurant staff and branch configurations directly from your dashboard.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/staff/new">
                <button className="px-6 py-3 bg-primary-500 text-slate-900 font-bold rounded-xl hover:bg-primary-400 transition-colors flex items-center gap-2">
                  <Users size={18} />
                  Add New Staff
                </button>
              </Link>
              <Link to="/staff">
                <button className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors flex items-center gap-2 backdrop-blur-sm">
                  View All Staff
                </button>
              </Link>
            </div>
          </div>
          <div className="absolute -right-8 -bottom-8 h-48 w-48 bg-primary-500/10 rounded-full blur-3xl" />
        </div>
      )}
    </div>
  );
}

/* ─── Stat Card (Cashier Dashboard) ─── */
function StatCard({ value, label, icon: Icon, color, bg }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className={clsx("h-9 w-9 rounded-xl flex items-center justify-center", bg)}>
        <Icon size={18} className={color} />
      </div>
      <div>
        <p className="text-lg font-black leading-none text-slate-900">{value}</p>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{label}</p>
      </div>
    </div>
  );
}

/* ─── Summary Card (Owner/Manager) ─── */
function SummaryCard({ icon: Icon, iconBg, iconColor, label, value, sub, to }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className={clsx("h-12 w-12 rounded-xl flex items-center justify-center", iconBg)}>
          <Icon size={24} className={iconColor} />
        </div>
        <Link to={to} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-primary-500 transition-colors">
          <ArrowRight size={20} />
        </Link>
      </div>
      <div className="mt-4">
        <h3 className="text-sm font-medium text-slate-500">{label}</h3>
        <p className="text-3xl font-bold text-slate-900">{value}</p>
      </div>
      <p className="mt-2 text-xs text-slate-400">{sub}</p>
    </div>
  );
}
