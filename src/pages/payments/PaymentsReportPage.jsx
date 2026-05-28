import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  TrendingUp, 
  Banknote, 
  Smartphone, 
  Calendar, 
  ArrowRight,
  RefreshCw,
  Search,
  Landmark,
  ShoppingBag
} from 'lucide-react';
import { getPayments } from '../../api/payments.api';
import { useAuthStore } from '../../store/auth.store';
import { useRealtimeChannel } from '../../hooks/useRealtimeChannel';
import { formatUGX } from '../../utils/currency';
import { formatDateTime } from '../../utils/format';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { clsx } from 'clsx';
import { toast } from 'react-hot-toast';

export default function PaymentsReportPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    date: new Date().toISOString().split('T')[0],
    branch_id: user?.role === 'owner' ? '' : user?.branch_id,
  });

  const { data: response, isLoading, refetch } = useQuery({
    queryKey: ['payments', filters],
    queryFn: () => getPayments(filters),
  });

  const payments = response?.payments || [];

  // Realtime
  useRealtimeChannel(`owner:alerts`, (payload) => {
    if (payload.event === 'payment_received') {
      toast.success(`${formatUGX(payload.data.amount_paid)} received!`, { icon: '💰' });
      queryClient.invalidateQueries(['payments']);
    }
  });

  // Calculate totals
  const totals = payments.reduce((acc, p) => {
    acc[p.payment_method] = (acc[p.payment_method] || 0) + p.amount_paid;
    acc.grand = (acc.grand || 0) + p.amount_paid;
    return acc;
  }, { cash: 0, airtel_money: 0, mtn_mobile_money: 0, equity: 0, glovo: 0, grand: 0 });

  const columns = [
    {
      key: 'created_at',
      label: 'Time',
      render: (val) => <span className="text-xs font-bold text-slate-500">{new Date(val).toLocaleTimeString()}</span>,
    },
    {
      key: 'order_number',
      label: 'Order #',
      render: (_, row) => <span className="text-sm font-black text-slate-900">#{row.order_number?.slice(-6).toUpperCase()}</span>,
    },
    {
      key: 'cashier_name',
      label: 'Cashier',
      render: (val) => <span className="text-sm font-medium text-slate-600">{val}</span>,
    },
    {
      key: 'payment_method',
      label: 'Method',
      render: (val) => {
        let badgeVariant = 'slate';
        if (val === 'cash') badgeVariant = 'emerald';
        else if (val === 'airtel_money') badgeVariant = 'red';
        else if (val === 'mtn_mobile_money') badgeVariant = 'amber';
        else if (val === 'equity') badgeVariant = 'violet';
        else if (val === 'glovo') badgeVariant = 'teal';
        
        return (
          <Badge variant={badgeVariant}>
            {val.replace('_', ' ')}
          </Badge>
        );
      },
    },
    {
      key: 'amount_paid',
      label: 'Amount',
      render: (val) => <span className="text-sm font-black text-slate-900">{formatUGX(val)}</span>,
    },
    {
      key: 'transaction_reference',
      label: 'Reference',
      render: (val) => <span className="text-xs font-mono font-bold text-slate-400">{val || '—'}</span>,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payments Report</h1>
          <p className="text-sm text-slate-500 mt-1">Consolidated view of revenue across settlement methods.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="date"
              className="h-10 pl-10 pr-4 rounded-xl border-slate-200 text-sm focus:ring-primary-500 font-bold bg-white"
              value={filters.date}
              onChange={(e) => setFilters(f => ({ ...f, date: e.target.value }))}
            />
          </div>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <MetricCard 
          icon={Banknote} 
          label="Cash Total" 
          value={totals.cash} 
          color="text-emerald-600" 
          bg="bg-emerald-50" 
        />
        <MetricCard 
          icon={Smartphone} 
          label="Airtel Money" 
          value={totals.airtel_money} 
          color="text-red-600" 
          bg="bg-red-50" 
        />
        <MetricCard 
          icon={Smartphone} 
          label="MTN MoMo" 
          value={totals.mtn_mobile_money} 
          color="text-amber-600" 
          bg="bg-amber-50" 
        />
        <MetricCard 
          icon={Landmark} 
          label="Equity Bank" 
          value={totals.equity || 0} 
          color="text-violet-600" 
          bg="bg-violet-50" 
        />
        <MetricCard 
          icon={ShoppingBag} 
          label="Glovo Total" 
          value={totals.glovo || 0} 
          color="text-teal-600" 
          bg="bg-teal-50" 
        />
        <MetricCard 
          icon={TrendingUp} 
          label="Grand Total" 
          value={totals.grand} 
          color="text-slate-900" 
          bg="bg-primary-500" 
          isDark={true}
        />
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
           <h3 className="font-bold text-slate-900">Transaction History</h3>
           <Badge variant="outline">{payments.length} Records</Badge>
        </div>
        <Table 
          columns={columns}
          data={payments}
          loading={isLoading}
          emptyMessage="No payments found for this date."
        />
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, color, bg, isDark = false }) {
  return (
    <div className={clsx(
      "p-6 rounded-3xl border transition-all flex flex-col gap-4",
      isDark ? "bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-900/20" : "bg-white border-slate-200"
    )}>
      <div className={clsx("h-10 w-10 rounded-xl flex items-center justify-center", isDark ? "bg-primary-500 text-slate-900" : bg)}>
        <Icon size={20} className={isDark ? "" : color} />
      </div>
      <div>
        <p className={clsx("text-[10px] font-black uppercase tracking-widest", isDark ? "text-slate-400" : "text-slate-400")}>{label}</p>
        <p className={clsx("text-2xl font-black tabular-nums", isDark ? "text-white" : "text-slate-900")}>{formatUGX(value)}</p>
      </div>
    </div>
  );
}
