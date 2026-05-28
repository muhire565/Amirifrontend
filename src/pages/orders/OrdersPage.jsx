import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  Plus, RefreshCw, Search, Calendar, Eye, Receipt, CheckCircle,
  Clock, User, Hash, AlertCircle, Wifi, Table2, Filter, X, ChevronDown, ChefHat
} from 'lucide-react';
import { getOrders } from '../../api/orders.api';
import { updateKdsOrderStatus } from '../../api/kds.api';
import { useAuthStore } from '../../store/auth.store';
import { useRealtimeChannel } from '../../hooks/useRealtimeChannel';
import { formatUGX } from '../../utils/currency';
import { ORDER_STATUSES, STATUS_LABELS, STATUS_COLORS } from '../../utils/orderStatus';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import clsx from 'clsx';

/* ─── Status config with dot colors ─── */
const STATUS_DOT = {
  pending:   { dot: '#94a3b8', bg: '#f1f5f9', text: '#334155', label: 'Pending' },
  confirmed: { dot: '#3b82f6', bg: '#dbeafe', text: '#1e40af', label: 'Confirmed' },
  preparing: { dot: '#f59e0b', bg: '#fef3c7', text: '#92400e', label: 'Preparing' },
  ready:     { dot: '#14b8a6', bg: '#ccfbf1', text: '#0f766e', label: 'Ready! 🔔' },
  served:    { dot: '#a855f7', bg: '#f3e8ff', text: '#7e22ce', label: 'Served' },
  billed:    { dot: '#f97316', bg: '#ffedd5', text: '#9a3412', label: 'Billed' },
  paid:      { dot: '#22c55e', bg: '#dcfce7', text: '#15803d', label: 'Paid ✓' },
  cancelled: { dot: '#ef4444', bg: '#fef2f2', text: '#b91c1c', label: 'Cancelled' },
  voided:    { dot: '#ef4444', bg: '#fef2f2', text: '#b91c1c', label: 'Voided' },
};

/* ─── Live elapsed timer hook ─── */
function useElapsed(createdAt) {
  const [elapsed, setElapsed] = useState('');
  const calc = useCallback(() => {
    const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`;
    return `${s}s`;
  }, [createdAt]);

  useEffect(() => {
    setElapsed(calc());
    const t = setInterval(() => setElapsed(calc()), 1000);
    return () => clearInterval(t);
  }, [calc]);

  return elapsed;
}

const ALL_STATUSES = ['', ...Object.values(ORDER_STATUSES)];

/* ════════════════════════════════════════════════════════════ */
export default function OrdersPage() {
  const { user, hasRole } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState({
    status: '',
    date: new Date().toISOString().split('T')[0],
    search: '',
  });
  const [liveFlash, setLiveFlash] = useState(false);

  const { data: response, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['orders', filters],
    queryFn: () => getOrders({ status: filters.status, date: filters.date }),
    refetchInterval: 8000,
  });

  const orders = Array.isArray(response?.orders) ? response.orders : [];

  /* ─── Filter by search locally ─── */
  const filtered = orders.filter(o => {
    if (!filters.search) return true;
    const q = filters.search.toLowerCase();
    return (
      o.order_number?.toLowerCase().includes(q) ||
      o.waiter?.full_name?.toLowerCase().includes(q) ||
      o.tables?.table_number?.toLowerCase().includes(q) ||
      (o.order_items || []).some(i => i.name?.toLowerCase().includes(q))
    );
  });

  /* ─── Realtime ─── */
  useRealtimeChannel(`branch:${user?.branch_id}`, (payload) => {
    queryClient.invalidateQueries(['orders']);
    setLiveFlash(true);
    setTimeout(() => setLiveFlash(false), 2000);
    if (payload.event === 'new_order') {
      toast.success('🔔 New order received!', { duration: 5000 });
    } else if (payload.event === 'order_ready') {
      toast.success(`✅ Order #${payload.data?.order_number?.slice(-6)} is READY!`, { duration: 6000 });
    } else if (payload.event === 'order_paid') {
      toast.success('💰 Order paid!', { duration: 4000 });
    }
  });

  /* ─── Summary counts ─── */
  const counts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* ── Header ── */}
      <PageHeader
        title="Orders"
        subtitle="Live order management — updates in real time"
        rightSlot={
          <div className="flex items-center gap-3">
            {/* Live indicator */}
            <div className={clsx(
              'flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all duration-300',
              liveFlash
                ? 'bg-emerald-500 text-white'
                : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
            )}>
              <span className={clsx(
                'h-1.5 w-1.5 rounded-full',
                liveFlash ? 'bg-white animate-ping' : 'bg-emerald-500 animate-pulse'
              )} />
              Live
            </div>
            <button
              onClick={() => refetch()}
              className="h-9 w-9 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-slate-700 hover:border-slate-300 transition-all"
            >
              <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
            </button>
            {hasRole('cashier') && (
              <Button onClick={() => navigate('/orders/new')} icon={Plus}>
                New Order
              </Button>
            )}
          </div>
        }
      />

      {/* ── Status Summary Pills ── */}
      <div className="flex gap-2 flex-wrap">
        {/* "All" pill */}
        <button
          onClick={() => setFilters(f => ({ ...f, status: '' }))}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest border-2 transition-all',
            filters.status === ''
              ? 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-900/20'
              : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
          )}
        >
          All
          <span className={clsx(
            'px-1.5 py-0.5 rounded-full text-[10px] font-black',
            filters.status === '' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
          )}>
            {orders.length}
          </span>
        </button>

        {/* Per-status pills */}
        {Object.values(ORDER_STATUSES).filter(s => counts[s] !== undefined || filters.status === s).map(status => {
          const cfg = STATUS_DOT[status];
          const isActive = filters.status === status;
          const count = counts[status] || 0;
          return (
            <button
              key={status}
              onClick={() => setFilters(f => ({ ...f, status: isActive ? '' : status }))}
              style={isActive ? { backgroundColor: cfg.bg, borderColor: cfg.dot, color: cfg.text } : {}}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest border-2 transition-all',
                isActive
                  ? 'shadow-sm'
                  : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
              )}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: isActive ? cfg.dot : '#cbd5e1' }}
              />
              {cfg?.label ?? status}
              {count > 0 && (
                <span
                  className="px-1.5 py-0.5 rounded-full text-[10px] font-black"
                  style={isActive
                    ? { backgroundColor: cfg.dot + '30', color: cfg.text }
                    : { backgroundColor: '#f1f5f9', color: '#64748b' }
                  }
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Filters Bar ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by order no, waiter, table…"
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-all bg-slate-50"
            />
            {filters.search && (
              <button
                onClick={() => setFilters(f => ({ ...f, search: '' }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
          {/* Date */}
          <div className="relative">
            <Calendar size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="date"
              value={filters.date}
              onChange={e => setFilters(f => ({ ...f, date: e.target.value }))}
              className="h-10 pl-10 pr-4 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-all bg-slate-50"
            />
          </div>
          {/* Today shortcut */}
          <button
            onClick={() => setFilters(f => ({ ...f, date: new Date().toISOString().split('T')[0] }))}
            className="h-10 px-4 rounded-xl border border-slate-200 text-[12px] font-bold text-slate-500 hover:bg-slate-50 hover:border-slate-300 transition-all whitespace-nowrap bg-white"
          >
            Today
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-amber-50 flex items-center justify-center">
              <Table2 size={16} className="text-amber-500" />
            </div>
            <div>
              <p className="text-[13px] font-black text-slate-900">
                {filtered.length} Order{filtered.length !== 1 ? 's' : ''}
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {filters.date === new Date().toISOString().split('T')[0] ? "Today's orders" : `Orders for ${filters.date}`}
              </p>
            </div>
          </div>
          {isFetching && !isLoading && (
            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-bold uppercase tracking-widest">
              <RefreshCw size={12} className="animate-spin" />
              Syncing…
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Spinner size="lg" />
            <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Loading orders…</p>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyOrdersState hasSearch={!!filters.search} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <TableHead>#  Order</TableHead>
                  <TableHead>Table</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Waiter</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead align="right">Actions</TableHead>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((order, idx) => (
                  <OrderRow
                    key={order.id}
                    order={order}
                    idx={idx}
                    isCashier={hasRole('cashier')}
                    isOwner={user?.role === 'owner' || user?.role === 'manager'}
                    navigate={navigate}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer */}
        {filtered.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-50 bg-slate-50/50 flex items-center justify-between">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Showing {filtered.length} of {orders.length} orders
            </p>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
              <Wifi size={11} />
              Real-time sync active
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Table Heading Cell ─── */
function TableHead({ children, align = 'left' }) {
  return (
    <th className={clsx(
      'px-5 py-3.5 text-[11px] font-black text-slate-500 uppercase tracking-[0.08em] whitespace-nowrap',
      align === 'right' ? 'text-right' : 'text-left'
    )}>
      {children}
    </th>
  );
}

/* ─── Single Order Row ─── */
function OrderRow({ order, idx, isCashier, isOwner, navigate }) {
  const queryClient = useQueryClient();
  const elapsed = useElapsed(order.created_at);
  const cfg = STATUS_DOT[order.status] || STATUS_DOT.pending;

  const orderNum = order.order_number?.slice(-6).toUpperCase() ?? '------';
  const isUrgent = order.status === 'ready';
  const isPaid   = order.status === 'paid';
  const isCancelled = ['cancelled', 'voided'].includes(order.status);

  const canMarkReady = isCashier && ['confirmed', 'preparing'].includes(order.status);
  const canBill    = isCashier && ['ready', 'served'].includes(order.status);
  const canView    = true;
  const canSettle  = isCashier && order.status === 'billed';

  /* Time display */
  const timeStr = new Date(order.created_at).toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit'
  });

  return (
    <tr
      className={clsx(
        'group transition-all duration-200',
        isUrgent ? 'bg-teal-50/40' : 'hover:bg-slate-50/70',
        isPaid && 'opacity-70',
      )}
      style={{ animationDelay: `${idx * 30}ms` }}
    >
      {/* Order Number */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          {/* Row accent */}
          <div
            className="h-8 w-1 rounded-full flex-shrink-0 transition-all"
            style={{ backgroundColor: cfg.dot }}
          />
          <div>
            <p className="text-[14px] font-black text-slate-900 font-mono tracking-tight">
              ORD-{orderNum}
            </p>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              #{order.order_number?.slice(-3)}
            </p>
          </div>
        </div>
      </td>

      {/* Table */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
            <Table2 size={13} />
          </div>
          <span className="text-[14px] font-bold text-slate-700">
            {order.tables?.table_number ? `T-${order.tables.table_number}` : '—'}
          </span>
        </div>
      </td>

      {/* Time */}
      <td className="px-5 py-4">
        <div className="flex flex-col">
          <span className="text-[14px] font-bold text-slate-800">{timeStr}</span>
          <span className={clsx(
            'text-[11px] font-bold uppercase tracking-widest mt-0.5 flex items-center gap-1',
            isUrgent ? 'text-teal-600' : 'text-slate-400'
          )}>
            <Clock size={9} />
            {elapsed} ago
          </span>
        </div>
      </td>

      {/* Waiter */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-[10px] font-black flex-shrink-0">
            {(order.waiter?.full_name || 'S').charAt(0).toUpperCase()}
          </div>
          <span className="text-[14px] font-semibold text-slate-700 max-w-[140px] truncate">
            {order.waiter?.full_name || 'Staff'}
          </span>
        </div>
      </td>

      {/* Items */}
      <td className="px-5 py-4">
        <div className="flex flex-col gap-1">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[13px] font-black w-fit">
            <Hash size={10} />
            {order.order_items?.length ?? 0}
          </span>
          {order.order_items?.length > 0 && (
            <p className="text-[11px] font-medium text-slate-400 max-w-[160px] truncate" title={(order.order_items || []).map(i => `${i.quantity}x ${i.name}`).join(', ')}>
              {(order.order_items || []).map(i => i.name).join(', ')}
            </p>
          )}
        </div>
      </td>

      {/* Amount */}
      <td className="px-5 py-4">
        <span className={clsx(
          'text-[15px] font-black',
          isPaid ? 'text-emerald-600' : 'text-slate-900'
        )}>
          {formatUGX(order.total_amount)}
        </span>
      </td>

      {/* Status */}
      <td className="px-5 py-4">
        <StatusPill status={order.status} />
      </td>

      {/* Actions */}
      <td className="px-5 py-4">
        <div className="flex items-center justify-end gap-1.5">
          {/* View */}
          <ActionBtn
            icon={Eye}
            label="View"
            onClick={() => navigate(`/orders/${order.id}`)}
            variant="ghost"
          />

          {/* Mark Ready (cashier override) */}
          {canMarkReady && (
            <ActionBtn
              icon={ChefHat}
              label="Ready"
              onClick={() => {
                updateKdsOrderStatus(order.id, 'ready')
                  .then(() => {
                    toast.success('Order marked as ready!');
                    queryClient.invalidateQueries(['orders']);
                  })
                  .catch((err) => toast.error(err.message || 'Failed to update'));
              }}
              variant="teal"
            />
          )}

          {/* Generate Bill */}
          {canBill && (
            <ActionBtn
              icon={Receipt}
              label="Bill"
              onClick={() => navigate(`/billing/${order.id}`)}
              variant="amber"
            />
          )}

          {/* Settle Payment */}
          {canSettle && (
            <ActionBtn
              icon={CheckCircle}
              label="Pay"
              onClick={() => navigate(`/billing/${order.id}`)}
              variant="green"
            />
          )}
        </div>
      </td>
    </tr>
  );
}

/* ─── Status Pill ─── */
function StatusPill({ status }) {
  const cfg = STATUS_DOT[status] || STATUS_DOT.pending;
  const isPulsing = status === 'ready' || status === 'pending';

  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest whitespace-nowrap"
      style={{ backgroundColor: cfg.bg, color: cfg.text }}
    >
      <span
        className={clsx('h-1.5 w-1.5 rounded-full flex-shrink-0', isPulsing && 'animate-pulse')}
        style={{ backgroundColor: cfg.dot }}
      />
      {cfg.label}
    </span>
  );
}

/* ─── Action Button ─── */
function ActionBtn({ icon: Icon, label, onClick, variant = 'ghost' }) {
  const styles = {
    ghost:  'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900',
    teal:   'bg-teal-500 text-white hover:bg-teal-600 shadow-sm shadow-teal-500/30',
    amber:  'bg-amber-500 text-white hover:bg-amber-600 shadow-sm shadow-amber-500/30',
    green:  'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm shadow-emerald-500/30',
  };
  return (
    <button
      onClick={onClick}
      title={label}
      className={clsx(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-150',
        styles[variant]
      )}
    >
      <Icon size={12} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

/* ─── Empty State ─── */
function EmptyOrdersState({ hasSearch }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
      <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <AlertCircle size={28} className="text-slate-300" />
      </div>
      <p className="text-[15px] font-black text-slate-900 mb-2">
        {hasSearch ? 'No orders match your search' : 'No orders found'}
      </p>
      <p className="text-[12px] font-medium text-slate-400 max-w-xs leading-relaxed">
        {hasSearch
          ? 'Try adjusting your search terms or clear the filter.'
          : 'No orders exist for this date and status. New orders will appear here automatically.'}
      </p>
    </div>
  );
}
