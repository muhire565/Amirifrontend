import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  TrendingUp, ShoppingBag, Clock, Calendar,
  Utensils, Bike, ChevronRight, AlertTriangle, AlertCircle,
  Users, CreditCard, Ban, Package, Check, Wallet
} from 'lucide-react';
import { getOwnerDashboardMetrics } from '../../api/reports.api';
import { useAuthStore } from '../../store/auth.store';
import MetricCard from '../../components/dashboard/MetricCard';
import RevenueChart from '../../components/dashboard/RevenueChart';
import PaymentMethodChart from '../../components/dashboard/PaymentMethodChart';
import { useRealtimeChannel } from '../../hooks/useRealtimeChannel';
import { playPaymentSound, playAlertSound } from '../../utils/sound';
import Badge from '../../components/ui/Badge';
import { format } from 'date-fns';
import { formatUGX } from '../../utils/currency';
import clsx from 'clsx';
import { Link, useSearchParams } from 'react-router-dom';
import { getBranches } from '../../api/branches.api';

// ── Greeting helper ──────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// ── Section card wrapper ─────────────────────────────────────────────────────
const Card = ({ children, className = '', style = {} }) => (
  <div
    className={clsx('bg-white rounded-[20px]', className)}
    style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', ...style }}
  >
    {children}
  </div>
);

// ── Skeleton for loading ─────────────────────────────────────────────────────
const Skeleton = ({ h = 140, className = '' }) => (
  <div className={clsx('skeleton rounded-[20px]', className)} style={{ height: h }} />
);

const OwnerDashboardPage = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedBranchId = searchParams.get('branch_id') || '';
  
  const [realtimeStatus, setRealtimeStatus] = useState('connecting');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  const { data: metrics, isLoading } = useQuery({
    queryKey: ['owner-metrics', selectedBranchId, selectedDate],
    queryFn: () => getOwnerDashboardMetrics({ branch_id: selectedBranchId, date: selectedDate }),
  });

  const { data: branchesResponse } = useQuery({
    queryKey: ['branches'],
    queryFn: getBranches,
    enabled: user?.role === 'owner'
  });

  const branches = branchesResponse?.branches || [];

  const addToFeed = useCallback(() => {}, []);

  const handleRealtimeEvent = useCallback((payload) => {
    console.log('[OwnerDashboard DEBUG] Event received →', payload);
    const event = payload.payload || payload;
    const type = event.type || payload.event;

    if (type === 'payment_received') {
      addToFeed({
        type: 'payment',
        label: 'Payment Received',
        message: `${event.payment_method?.replace('_', ' ')} payment of ${formatUGX(event.amount)}`,
        color: '#10B981'
      });
      playPaymentSound();
      queryClient.invalidateQueries(['owner-metrics']);
    } else if (type === 'low_stock_alert') {
      addToFeed({
        type: 'low_stock',
        label: 'Low Stock Alert',
        message: `${event.stock_item_name} is below threshold (${event.current_quantity}${event.unit || ''} left)`,
        color: '#EF4444'
      });
      playAlertSound();
    } else if (type === 'void_request') {
      addToFeed({
        type: 'void',
        label: 'Void Request',
        message: `New void request for Order #${event.order_number}`,
        color: '#F59E0B'
      });
      playAlertSound();
    }
  }, [addToFeed, queryClient]);

  useRealtimeChannel('owner:alerts', handleRealtimeEvent, (status) => {
    if (status === 'SUBSCRIBED') setRealtimeStatus('connected');
    else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setRealtimeStatus('error');
  });

  // ── Normalise backend response → consistent shape used by this component ──
  // Backend returns: { revenue, orders, payments, average_order_value,
  //   top_menu_items, inventory_alerts, active_tables, cash_reconciliation }
  // Frontend was written expecting different key names — bridge them here.
  const m = useMemo(() => {
    if (!metrics) return null;
    return {
      // KPI cards
      total_revenue:     metrics.revenue?.total            ?? 0,
      total_orders:      metrics.orders?.total             ?? 0,
      avg_order_value:   metrics.average_order_value       ?? 0,
      pending_orders:    metrics.orders?.pending           ?? 0,

      // Revenue by type
      revenue_by_type: {
        dine_in:   metrics.revenue?.dine_in   ?? 0,
        delivery:  metrics.revenue?.delivery  ?? 0,
        takeaway:  metrics.revenue?.takeaway  ?? 0,
      },

      // Payment breakdown — already in correct shape { cash: {count,total}, ... }
      payments: metrics.payments ?? {},

      // Top menu items
      top_menu_items: (metrics.top_menu_items || []).map(i => ({
        name:         i.name,
        category:     i.category ?? '',
        revenue:      i.revenue  ?? 0,
        orders_count: i.quantity_sold ?? i.orders_count ?? 0,
      })),

      // Low-stock alerts
      low_stock_alerts: metrics.inventory_alerts ?? [],

      // Tables list for snapshot
      tables_list: metrics.tables_list ?? [],
      active_tables: metrics.active_tables ?? { occupied: 0, total: 0 },

      // Staff performance
      staff_performance: metrics.staff_performance ?? [],

      // Expenses
      expenses: {
        count: metrics.expenses?.count ?? 0,
        total_value: metrics.expenses?.total_value ?? 0,
        items: metrics.expenses?.items ?? [],
      },

      // Void summary
      void_summary: {
        count: metrics.orders?.voided ?? 0,
      },

      // Cash reconciliation
      cash_reconciliation: {
        expected_cash: metrics.cash_reconciliation?.cash_expected
                    ?? metrics.cash_reconciliation?.expected_cash ?? 0,
        total_sales:   metrics.cash_reconciliation?.system_total  ?? 0,
      },

      // Revenue trend (used by chart)
      revenue_trend: metrics.revenue_trend ?? [],
    };
  }, [metrics]);

  // Transform payment methods for the chart
  const paymentChartData = useMemo(() => {
    if (!m?.payments) return [];
    const labels = {
      cash:             'Cash',
      airtel_money:     'Airtel Money',
      mtn_mobile_money: 'MTN Mobile Money',
      equity:           'Equity Bank',
      glovo:            'Glovo',
    };
    return Object.entries(m.payments).map(([key, val]) => ({
      name:  labels[key] ?? key,
      value: val,   // PaymentMethodChart safely extracts {count,total} objects
    }));
  }, [m?.payments]);

  // Transform revenue trend for chart
  const revenueTrendData = useMemo(() => {
    if (!m?.revenue_trend?.length) return [];
    return m.revenue_trend.map(item => ({
      time:     item.time,
      dine_in:  item.dine_in  || 0,
      delivery: item.delivery || 0,
      takeaway: item.takeaway || 0,
    }));
  }, [m?.revenue_trend]);

  const firstName    = user?.full_name?.split(' ')[0] ?? 'Chef';
  const pendingOrders = m?.pending_orders ?? 0;
  const hasAlerts     = (m?.low_stock_alerts?.length || 0) > 0;


  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="h-16 w-16 rounded-[22px] bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-200">
            <TrendingUp size={32} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0A0F1E', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                Dashboard
              </h1>
              {realtimeStatus === 'connected' ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full animate-in fade-in zoom-in duration-500">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">System Live</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full">
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Connecting...</span>
                </div>
              )}
            </div>
            <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 500, marginTop: 4 }}>
              {m?.branch_name || 'All Branches'} — {format(new Date(selectedDate + 'T00:00:00'), 'EEEE, dd MMMM yyyy')}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm">
            <button
              onClick={() => setSearchParams({})}
              className={clsx(
                "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                !selectedBranchId ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:bg-slate-50"
              )}
            >
              All
            </button>
            {branches.slice(0, 2).map(b => (
              <button
                key={b.id}
                onClick={() => setSearchParams({ branch_id: b.id })}
                className={clsx(
                  "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap",
                  selectedBranchId === b.id ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400 hover:bg-slate-50"
                )}
              >
                {b.name}
              </button>
            ))}
            {branches.length > 2 && (
              <select 
                value={selectedBranchId}
                onChange={(e) => setSearchParams(e.target.value ? { branch_id: e.target.value } : {})}
                className="bg-transparent border-none text-xs font-black uppercase tracking-widest text-slate-400 focus:ring-0 cursor-pointer px-2"
              >
                <option value="">More...</option>
                {branches.slice(2).map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            )}
          </div>
          
          {/* Date Picker */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-3 py-1.5 shadow-sm">
            <Calendar size={15} className="text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border-none bg-transparent text-xs font-bold text-slate-700 focus:ring-0 outline-none cursor-pointer"
            />
            {!isToday && (
              <button
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                className="px-2 py-1 rounded-lg bg-indigo-50 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:bg-indigo-100 transition-colors"
              >
                Today
              </button>
            )}
          </div>

          <div
            className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-2.5 shadow-sm"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span style={{ fontSize: 11, fontWeight: 800, color: '#059669', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              {isToday ? 'Live System' : 'Historical'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Low stock alert banner ───────────────────────────────────────── */}
      {hasAlerts && (
        <div
          className="flex items-center justify-between gap-4 rounded-[14px]"
          style={{
            background: 'rgba(239,68,68,0.06)',
            border: '1px solid rgba(239,68,68,0.20)',
            padding: '14px 20px'
          }}
        >
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} color="#EF4444" />
            <span style={{ fontSize: 14, color: '#374151', fontWeight: 500 }}>
              Low stock on <strong>{m.low_stock_alerts.length}</strong> item(s) — action required.
            </span>
          </div>
          <Link
            to="/inventory"
            style={{ fontSize: 13, fontWeight: 600, color: '#EF4444', whiteSpace: 'nowrap' }}
            className="hover:underline"
          >
            View Inventory →
          </Link>
        </div>
      )}

      {/* ── Metric Cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {isLoading ? (
          [1,2,3,4,5].map(i => <Skeleton key={i} />)
        ) : (
          <>
            <MetricCard
              label="Total Revenue"
              value={m?.total_revenue ?? 0}
              icon={TrendingUp}
              theme="revenue"
              prefix="UGX "
              sublabel="vs yesterday"
              delta={{ type: 'up', value: 12 }}
            />
            <MetricCard
              label="Total Orders"
              value={m?.total_orders ?? 0}
              icon={ShoppingBag}
              theme="orders"
              sublabel="orders today"
              delta={{ type: 'up', value: 8 }}
            />
            <MetricCard
              label="Avg Order Value"
              value={m?.avg_order_value ?? 0}
              icon={Utensils}
              theme="avg"
              prefix="UGX "
              sublabel="per order"
            />
            <Link to="/expenses">
              <MetricCard
                label="Expenses"
                value={m?.expenses?.total_value ?? 0}
                icon={Wallet}
                theme="expenses"
                prefix="UGX "
                sublabel={`${m?.expenses?.count ?? 0} expense(s) today`}
              />
            </Link>
            <MetricCard
              label="Pending Orders"
              value={pendingOrders}
              icon={Clock}
              theme="pending"
              sublabel="awaiting kitchen"
              isPending
            />
          </>
        )}
      </div>

      {/* ── Empty state ──────────────────────────────────────────────────── */}
      {!isLoading && !m?.total_revenue && !m?.total_orders && (
        <p style={{ fontSize: 14, color: '#94A3B8', textAlign: 'center', padding: '20px 0' }}>
          No transactions recorded yet today. Orders will appear here in real time.
        </p>
      )}

      {/* ── Charts Row ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-5">
        {/* Revenue Trend */}
        <Card className="p-6">
          <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0A0F1E' }}>Revenue Trend</h2>
              <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>Performance over time</p>
            </div>
            {/* Legend */}
            <div className="flex items-center gap-4 flex-wrap">
              {[
                { label: 'Delivery', color: '#4F46E5' },
                { label: 'Dine-In',  color: '#F59E0B' },
                { label: 'Takeaway', color: '#10B981' },
              ].map(({ label, color }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span className="rounded-full" style={{ width: 8, height: 8, background: color, display: 'inline-block' }} />
                  <span style={{ fontSize: 12, color: '#64748B' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ paddingTop: 4 }}>
            {isLoading
              ? <Skeleton h={240} />
              : <RevenueChart data={revenueTrendData} />
            }
          </div>
        </Card>

        {/* Payment Breakdown */}
        <PaymentMethodChart data={paymentChartData} />
      </div>

      {/* ── Secondary Grid ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        
        {/* Top Selling Items */}
        <Card className="p-6 flex flex-col min-h-[420px]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#0A0F1E' }}>Top Items Today</h3>
              <p style={{ fontSize: 12, color: '#94A3B8' }}>Most popular dishes</p>
            </div>
            <Link to="/menu" style={{ fontSize: 12, fontWeight: 600, color: '#4F46E5' }} className="px-3 py-1 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
              See all
            </Link>
          </div>
          <div className="flex-1 space-y-4">
            {(m?.top_menu_items || []).length > 0 ? (
              (m?.top_menu_items || []).slice(0, 5).map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-4 p-3 rounded-2xl transition-all hover:bg-slate-50 border border-transparent hover:border-slate-100"
                >
                  <div 
                    className="flex items-center justify-center rounded-xl font-bold shrink-0"
                    style={{ 
                      width: 40, height: 40, fontSize: 12,
                      background: idx === 0 ? 'linear-gradient(135deg, #4F46E5, #7C3AED)' : '#F1F5F9',
                      color: idx === 0 ? 'white' : '#64748B'
                    }}
                  >
                    #{idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#0A0F1E' }} className="truncate">{item.name}</p>
                    <p style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.category || 'Main Course'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#0A0F1E' }}>{formatUGX(item.revenue)}</p>
                    <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>{item.orders_count} sold</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full opacity-40 py-10">
                <ShoppingBag size={48} className="mb-2" />
                <p style={{ fontSize: 13 }}>No sales data yet</p>
              </div>
            )}
          </div>
        </Card>

        {/* Mini Revenue by Type */}
        <div className="flex flex-col gap-4 min-h-[420px]">
          <div className="flex-1 flex flex-col gap-4">
            {[
              { 
                label: 'Dine-In Revenue',   
                value: m?.revenue_by_type?.dine_in ?? 0, 
                color: '#4F46E5', 
                bg: 'linear-gradient(135deg, rgba(79,70,229,0.1), rgba(79,70,229,0.02))',  
                Icon: Utensils,
                desc: 'In-house sales'
              },
              { 
                label: 'Delivery Revenue',  
                value: m?.revenue_by_type?.delivery ?? 0, 
                color: '#06B6D4', 
                bg: 'linear-gradient(135deg, rgba(6,182,212,0.1), rgba(6,182,212,0.02))', 
                Icon: Bike,
                desc: 'External orders'
              },
            ].map(({ label, value, color, bg, Icon, desc }) => (
              <Card key={label} className="p-6 flex-1 flex flex-col justify-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden relative group">
                <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
                  <Icon size={120} color={color} />
                </div>
                <div className="flex items-start gap-4 relative z-10">
                  <div className="rounded-2xl flex items-center justify-center shrink-0 shadow-sm" style={{ width: 56, height: 56, background: bg, border: `1px solid ${color}20` }}>
                    <Icon size={28} color={color} />
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {label}
                    </p>
                    <p style={{ fontSize: 24, fontWeight: 800, color: '#0A0F1E', margin: '4px 0' }}>{formatUGX(value)}</p>
                    <p style={{ fontSize: 12, color: '#64748B' }}>{desc}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          <Card className="p-4 bg-navy-800 text-white border-0 shadow-2xl flex items-center justify-between">
             <div className="flex items-center gap-3">
               <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center">
                 <AlertCircle size={20} className="text-cyan-400" />
               </div>
               <div>
                 <p className="text-[13px] font-bold">Kitchen Performance</p>
                 <p className="text-[11px] text-slate-400">Avg. 14 mins prep time</p>
               </div>
             </div>
             <ChevronRight size={18} className="text-slate-500" />
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-5">

        {/* Staff Performance */}
        <Card className="p-6 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#0A0F1E' }}>Staff Performance Today</h3>
              <p style={{ fontSize: 12, color: '#94A3B8' }}>Leaderboard based on sales</p>
            </div>
            <div className="flex p-1 bg-slate-100 rounded-xl">
              {['Waiters', 'Cashiers'].map((tab, i) => (
                <button
                  key={tab}
                  className={clsx(
                    "px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                    i === 0 ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 space-y-6">
            {(m?.staff_performance || []).length > 0 ? (
              (m?.staff_performance || []).slice(0, 5).map((staff, idx) => (
                <div key={idx} className="flex items-center gap-4 group bg-slate-50/50 p-4 rounded-[20px] border border-slate-100 hover:border-indigo-200 transition-all duration-300">
                  <div className="relative">
                    <div
                      className="flex items-center justify-center rounded-2xl font-black text-white shrink-0 shadow-lg"
                      style={{ 
                        width: 52, height: 52, fontSize: 18, 
                        background: idx === 0 ? 'linear-gradient(135deg, #FFD700, #DAA520)' : 
                                   idx === 1 ? 'linear-gradient(135deg, #C0C0C0, #808080)' :
                                   idx === 2 ? 'linear-gradient(135deg, #CD7F32, #8B4513)' : 'linear-gradient(135deg, #475569, #1E293B)'
                      }}
                    >
                      {staff.full_name?.charAt(0)}
                    </div>
                    {idx < 3 && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg border border-slate-50">
                        <span style={{ fontSize: 12, fontWeight: 900, color: '#0A0F1E' }}>
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p style={{ fontSize: 15, fontWeight: 800, color: '#0A0F1E' }} className="truncate">{staff.full_name}</p>
                        <p style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          {staff.role}
                        </p>
                      </div>
                      <div className="text-right">
                        <p style={{ fontSize: 15, fontWeight: 900, color: '#4F46E5' }}>{formatUGX(staff.total_sales)}</p>
                        <p style={{ fontSize: 10, fontWeight: 700, color: '#64748B' }}>{staff.orders_count} sales</p>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-200/50 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{
                          background: idx === 0 ? 'linear-gradient(90deg, #F59E0B, #FFD700)' : 'linear-gradient(90deg, #4F46E5, #06B6D4)',
                          width: `${Math.min(100, (staff.total_sales / (m.staff_performance[0]?.total_sales || 1)) * 100)}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full opacity-40 py-10">
                <Users size={48} className="mb-2" />
                <p style={{ fontSize: 13, fontWeight: 700 }}>No active staff data for today</p>
              </div>
            )}
          </div>

          <Link
            to="/staff"
            className="mt-8 pt-5 border-t border-slate-50 flex items-center justify-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors font-bold text-[11px] uppercase tracking-wider"
          >
            Detailed Analytics <ChevronRight size={14} />
          </Link>
        </Card>

        {/* Cash Reconciliation */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#0A0F1E' }}>Cash Reconciliation</h3>
            <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500 }}>{format(new Date(), 'dd MMM')}</span>
          </div>

          {/* Expected cash hero */}
          <div
            className="rounded-2xl p-5 text-center mb-5"
            style={{ background: 'linear-gradient(135deg,rgba(79,70,229,0.06),rgba(6,182,212,0.06))', border: '1px solid rgba(79,70,229,0.10)' }}
          >
            <p style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Expected in Drawer
            </p>
            <p style={{ fontSize: 30, fontWeight: 700, color: '#0A0F1E', letterSpacing: '-0.02em' }}>
              {formatUGX(m?.cash_reconciliation?.expected_cash ?? 0)}
            </p>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Cash Sales',       value: m?.cash_reconciliation?.total_sales                    ?? 0, color: '#0A0F1E' },
              { label: 'Airtel Money',     value: m?.payments?.airtel_money?.total      ?? 0, color: '#0A0F1E' },
              { label: 'MTN Mobile Money', value: m?.payments?.mtn_mobile_money?.total  ?? 0, color: '#0A0F1E' },
              { label: 'Equity Bank',      value: m?.payments?.equity?.total            ?? 0, color: '#0A0F1E' },
              { label: 'Glovo Deliveries', value: m?.payments?.glovo?.total             ?? 0, color: '#0A0F1E' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex justify-between items-center">
                <span style={{ fontSize: 13, color: '#64748B', fontWeight: 500 }}>{label}</span>
                <span style={{ fontSize: 13, color, fontWeight: 700 }}>{formatUGX(value)}</span>
              </div>
            ))}

            <div style={{ height: 1, background: '#F1F5F9', margin: '8px 0' }} />

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <AlertCircle size={14} color="#EF4444" />
                <span style={{ fontSize: 13, color: '#64748B', fontWeight: 500 }}>Voids Today</span>
              </div>
              <span style={{ fontSize: 13, color: '#EF4444', fontWeight: 700 }}>
                {m?.void_summary?.count ?? 0} orders
              </span>
            </div>
          </div>

          <Link
            to="/reports/cash"
            className="flex items-center justify-center gap-2 mt-5 pt-4 transition-all hover:gap-3"
            style={{ borderTop: '1px solid #F1F5F9', fontSize: 12, fontWeight: 600, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.06em' }}
          >
            Full Reconciliation <ChevronRight size={14} />
          </Link>
        </Card>
      </div>
    </div>
  );
};

export default OwnerDashboardPage;
