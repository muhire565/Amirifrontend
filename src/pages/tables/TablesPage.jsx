import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Store, Users, MapPin, Loader2, Settings, UtensilsCrossed, Clock, ShoppingBag, Plus, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getTables } from '../../api/tables.api';
import { useAuthStore } from '../../store/auth.store';
import { useRealtimeChannel } from '../../hooks/useRealtimeChannel';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { clsx } from 'clsx';

export default function TablesPage() {
  const { user, hasRole } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: response, isLoading } = useQuery({
    queryKey: ['tables', user?.branch_id],
    queryFn: () => getTables({ branch_id: user?.branch_id }),
    refetchInterval: 30000, // 30 seconds
  });

  const tables = response?.tables || [];

  // Realtime updates
  useRealtimeChannel(`branch:${user?.branch_id}`, (payload) => {
    // On any order update that might affect table status
    queryClient.invalidateQueries(['tables']);
  });

  const availableCount = tables.filter(t => t.status === 'available').length;
  const occupiedCount = tables.filter(t => t.status === 'occupied').length;
  const reservedCount = tables.filter(t => t.status === 'reserved').length;
  const totalSeats = tables.reduce((a, t) => a + (t.capacity || 0), 0);
  const usedSeats = tables.reduce((a, t) => a + (t.seats_occupied || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* ── Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-xl shadow-indigo-200">
            <MapPin size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Floor Plan</h1>
            <p className="text-[13px] text-slate-400 font-medium mt-0.5">
              Main Dining Hall — {tables.length} table{tables.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {hasRole(['owner', 'manager']) && (
            <button
              onClick={() => navigate('/tables/manage')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border-2 border-slate-200 bg-white text-slate-600 text-[12px] font-bold uppercase tracking-widest hover:border-indigo-300 hover:text-indigo-600 transition-all shadow-sm"
            >
              <Settings size={15} />
              Manage Layout
            </button>
          )}
        </div>
      </div>

      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard value={availableCount} label="Available" dotColor="bg-emerald-500" bgColor="bg-emerald-50" textColor="text-emerald-700" />
        <StatCard value={occupiedCount} label="Occupied" dotColor="bg-amber-500" bgColor="bg-amber-50" textColor="text-amber-700" />
        <StatCard value={reservedCount} label="Reserved" dotColor="bg-blue-500" bgColor="bg-blue-50" textColor="text-blue-700" />
        <StatCard value={`${usedSeats}/${totalSeats}`} label="Seats Used" dotColor="bg-violet-500" bgColor="bg-violet-50" textColor="text-violet-700" />
      </div>

      {/* ── Tables Grid ── */}
      <div className="bg-white rounded-[20px] border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-indigo-50 flex items-center justify-center">
              <UtensilsCrossed size={16} className="text-indigo-500" />
            </div>
            <span className="text-[13px] font-black text-slate-800">Dining Floor</span>
          </div>
          <div className="flex items-center gap-4">
            <LegendItem color="bg-emerald-500" label="Available" />
            <LegendItem color="bg-amber-500" label="Occupied" />
            <LegendItem color="bg-blue-500" label="Reserved" />
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="h-14 w-14 rounded-2xl bg-indigo-50 flex items-center justify-center">
              <Loader2 className="animate-spin text-indigo-500" size={28} />
            </div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[11px]">Loading floor plan...</p>
          </div>
        ) : tables.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 opacity-40">
            <UtensilsCrossed size={56} className="text-slate-300" />
            <p className="text-[15px] font-bold text-slate-500">No tables configured</p>
            <p className="text-[12px] text-slate-400">Add tables from the Manage Layout page.</p>
          </div>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {tables.map((table) => (
                <TableCard key={table.id} table={table} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Summary Stat Card ─── */
function StatCard({ value, label, dotColor, bgColor, textColor }) {
  return (
    <div className={clsx("flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-slate-100 bg-white shadow-sm")}>
      <div className={clsx("h-9 w-9 rounded-xl flex items-center justify-center", bgColor)}>
        <div className={clsx("h-3 w-3 rounded-full", dotColor)} />
      </div>
      <div>
        <p className={clsx("text-lg font-black leading-none", textColor)}>{value}</p>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function TableCard({ table }) {
  const navigate = useNavigate();
  const { hasRole } = useAuthStore();

  const availableSeats = table.available_seats ?? table.capacity;
  const hasSeats = availableSeats > 0;

  const handleClick = () => {
    if (table.status === 'occupied' && table.active_order_id && !hasSeats) {
      navigate(`/orders/${table.active_order_id}`);
    } else if (hasSeats && hasRole('cashier')) {
      navigate(`/orders/new?table_id=${table.id}&table_number=${table.table_number}`);
    } else if (table.status === 'occupied' && table.active_order_id) {
      navigate(`/orders/${table.active_order_id}`);
    }
  };

  const isActionable = (table.status === 'occupied' && table.active_order_id) || (hasSeats && hasRole('cashier'));
  const seatsOccupied = table.seats_occupied || 0;
  const seatsFraction = seatsOccupied / (table.capacity || 1);

  const statusConfig = {
    available: {
      border: 'border-emerald-200 hover:border-emerald-400',
      bg: 'bg-gradient-to-b from-emerald-50/80 to-white',
      ring: 'ring-emerald-500',
      dot: 'bg-emerald-500',
      text: 'text-emerald-700',
      label: 'Available',
      tableColor: 'from-emerald-400 to-emerald-600',
    },
    occupied: {
      border: 'border-amber-200 hover:border-amber-400',
      bg: 'bg-gradient-to-b from-amber-50/80 to-white',
      ring: 'ring-amber-500',
      dot: 'bg-amber-500',
      text: 'text-amber-700',
      label: 'Occupied',
      tableColor: 'from-amber-400 to-orange-500',
    },
    reserved: {
      border: 'border-blue-200 hover:border-blue-400',
      bg: 'bg-gradient-to-b from-blue-50/80 to-white',
      ring: 'ring-blue-500',
      dot: 'bg-blue-500',
      text: 'text-blue-700',
      label: 'Reserved',
      tableColor: 'from-blue-400 to-blue-600',
    },
    cleaning: {
      border: 'border-slate-200 hover:border-slate-400',
      bg: 'bg-gradient-to-b from-slate-50/80 to-white',
      ring: 'ring-slate-500',
      dot: 'bg-slate-400',
      text: 'text-slate-500',
      label: 'Cleaning',
      tableColor: 'from-slate-300 to-slate-500',
    },
  };
  const cfg = statusConfig[table.status] || statusConfig.available;

  return (
    <div
      onClick={handleClick}
      className={clsx(
        "relative rounded-[20px] border-2 p-5 transition-all duration-300 group overflow-hidden",
        cfg.border, cfg.bg,
        isActionable ? "cursor-pointer hover:shadow-xl hover:-translate-y-1" : "opacity-75"
      )}
    >
      {/* Status Indicator */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-1.5">
          <span className={clsx("h-2 w-2 rounded-full", cfg.dot, table.status === 'occupied' && "animate-pulse")} />
          <span className={clsx("text-[10px] font-black uppercase tracking-widest", cfg.text)}>{cfg.label}</span>
        </div>
        {table.status === 'occupied' && (
          <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 rounded-lg">
            <Clock size={9} className="text-amber-600" />
            <span className="text-[9px] font-black text-amber-700">ACTIVE</span>
          </div>
        )}
      </div>

      {/* Visual Table Representation */}
      <div className="flex justify-center mb-4">
        <div className={clsx(
          "relative h-20 w-20 rounded-2xl bg-gradient-to-br shadow-lg flex items-center justify-center",
          cfg.tableColor
        )}>
          <span className="text-white text-2xl font-black drop-shadow-sm">
            {table.table_number}
          </span>
          {/* Chair dots */}
          {Array.from({ length: Math.min(table.capacity, 8) }).map((_, i) => {
            const angle = (360 / Math.min(table.capacity, 8)) * i - 90;
            const rad = (angle * Math.PI) / 180;
            const x = 50 + 46 * Math.cos(rad);
            const y = 50 + 46 * Math.sin(rad);
            const isOccupied = i < seatsOccupied;
            return (
              <div
                key={i}
                className={clsx(
                  "absolute h-3.5 w-3.5 rounded-full border-2 border-white shadow-sm transition-colors",
                  isOccupied ? "bg-slate-700" : "bg-white/80"
                )}
                style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
              />
            );
          })}
        </div>
      </div>

      {/* Table Label */}
      <div className="text-center mb-3">
        <h3 className="text-[15px] font-black text-slate-900 leading-tight">Table {table.table_number}</h3>
        <div className="flex items-center justify-center gap-1.5 mt-1">
          <Users size={12} className="text-slate-400" />
          <span className="text-[11px] font-bold text-slate-500">
            {seatsOccupied}/{table.capacity} seats
          </span>
        </div>
      </div>

      {/* Seat Progress Bar */}
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
        <div
          className={clsx(
            "h-full rounded-full transition-all duration-500",
            table.status === 'occupied' ? "bg-amber-400" :
            table.status === 'reserved' ? "bg-blue-400" : "bg-emerald-400"
          )}
          style={{ width: `${seatsFraction * 100}%` }}
        />
      </div>

      {/* Occupied Info */}
      {table.status === 'occupied' && (
        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-2.5 text-center border border-slate-100/80">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
            {table.active_orders_count || 1} order{(table.active_orders_count || 1) > 1 ? 's' : ''}
          </p>
          {hasSeats && (
            <p className="text-[10px] font-bold text-emerald-600 mt-0.5">{availableSeats} seat{availableSeats > 1 ? 's' : ''} free</p>
          )}
        </div>
      )}

      {/* Hover Actions */}
      {table.status === 'available' && isActionable && (
        <div className="absolute inset-0 rounded-[18px] bg-emerald-600/90 backdrop-blur-sm flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
          <Plus size={28} className="text-white" />
          <p className="text-[12px] font-black text-white uppercase tracking-widest">New Order</p>
        </div>
      )}

      {table.status === 'occupied' && isActionable && (
        <div className="absolute inset-0 rounded-[18px] bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
          {hasSeats && hasRole('cashier') ? (
            <>
              <Plus size={28} className="text-white" />
              <p className="text-[12px] font-black text-white uppercase tracking-widest">Add Client</p>
            </>
          ) : (
            <>
              <ArrowRight size={28} className="text-white" />
              <p className="text-[12px] font-black text-white uppercase tracking-widest">View Order</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function LegendItem({ color, label }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={clsx("h-2.5 w-2.5 rounded-full", color)} />
      <span className="text-[11px] font-bold text-slate-500">{label}</span>
    </div>
  );
}
