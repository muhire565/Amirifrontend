import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Clock, 
  ChefHat, 
  CheckCircle2, 
  AlertTriangle,
  UtensilsCrossed,
  Filter,
  RefreshCw,
  Search,
  CalendarDays
} from 'lucide-react';
import { getKdsOrders, updateKdsOrderStatus, updateKdsItemStatus } from '../../api/kds.api';
import { getBranches } from '../../api/branches.api';
import { useAuthStore } from '../../store/auth.store';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { format } from 'date-fns';

const KDSOrderCard = ({ order, onStatusUpdate }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = new Date(order.created_at);
    const interval = setInterval(() => {
      setElapsed(Math.floor((new Date() - start) / 1000 / 60));
    }, 60000);
    setElapsed(Math.floor((new Date() - start) / 1000 / 60));
    return () => clearInterval(interval);
  }, [order.created_at]);

  const isOverdue = elapsed >= 20;
  const isUrgent = elapsed >= 10 && elapsed < 20;

  return (
    <div className={clsx(
      "bg-slate-900 border rounded-2xl flex flex-col transition-all duration-300 overflow-hidden",
      isOverdue ? "border-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.15)]" : 
      isUrgent ? "border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.1)]" :
      "border-slate-800 shadow-xl",
      order.isNewOrder && "kds-new-order"
    )}>
      {/* Header Bar */}
      <div className={clsx(
        "px-5 py-3 flex items-center justify-between",
        isOverdue ? "bg-red-500/10" : isUrgent ? "bg-amber-500/10" : "bg-slate-800/50"
      )}>
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-black text-white tracking-tight">#{order.order_number}</h3>
          <div className="px-2.5 py-1 bg-brand-primary/90 rounded-lg text-[10px] font-black text-slate-900 uppercase tracking-wider">
            T-{String(order.tables?.table_number || '?').replace(/^table\s*/i, '')}
          </div>
          <div className={clsx(
            "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider",
            order.status === 'pending' ? "bg-amber-500/20 text-amber-400" :
            order.status === 'confirmed' ? "bg-blue-500/20 text-blue-400" :
            order.status === 'preparing' ? "bg-brand-primary/20 text-brand-primary" :
            order.status === 'ready' ? "bg-emerald-500/20 text-emerald-400" :
            ['served', 'billed', 'paid'].includes(order.status) ? "bg-slate-600/20 text-slate-400" :
            "bg-slate-700/50 text-slate-400"
          )}>
            {order.status}
          </div>
        </div>
        <div className={clsx(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-sm font-bold",
          isOverdue ? "bg-red-500/20 text-red-400" : isUrgent ? "bg-amber-500/20 text-amber-400" : "bg-slate-800 text-brand-primary"
        )}>
          <Clock size={13} />
          <span>{elapsed}m</span>
        </div>
      </div>

      {/* Order Meta */}
      <div className="px-5 pt-3 pb-2 flex items-center justify-between">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          Waiter: <span className="text-slate-300">{order.waiter?.full_name || 'Staff'}</span>
        </p>
        <span className="text-[10px] font-bold text-slate-600">
          {order.order_items?.length || 0} item{(order.order_items?.length || 0) !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Kitchen Note */}
      {order.notes && (
        <div className="mx-5 mb-3 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <p className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
            <AlertTriangle size={11} className="shrink-0" />
            <span className="uppercase tracking-wider">Kitchen Note:</span>
          </p>
          <p className="text-[12px] text-amber-200/90 mt-1 leading-relaxed">{order.notes}</p>
        </div>
      )}

      {/* Items List */}
      <div className="flex-1 px-5 pb-4 space-y-2">
        {order.order_items?.map((item, idx) => (
          <div key={idx} className="flex items-center gap-3 py-2.5 border-b border-slate-800/60 last:border-0">
             <div className="h-9 w-9 rounded-lg bg-slate-800 flex items-center justify-center text-white font-black text-sm shrink-0 border border-slate-700/50">
               {item.quantity}x
             </div>
             <div className="flex-1 min-w-0">
               <p className="text-[13px] font-bold text-slate-100 leading-tight truncate">
                 {item.name}
               </p>
               {item.special_instructions && (
                 <p className="text-[11px] italic text-amber-400/80 mt-0.5 truncate flex items-center gap-1">
                   <AlertTriangle size={9} className="shrink-0" /> {item.special_instructions}
                 </p>
               )}
             </div>
             <button 
               onClick={() => onStatusUpdate(order.id, item.id, item.status)}
               className={clsx(
                 "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shrink-0",
                 item.status === 'pending' ? "bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600 hover:text-slate-200" :
                 item.status === 'preparing' ? "bg-brand-primary text-slate-900 shadow-lg shadow-brand-primary/20 hover:brightness-110" :
                 item.status === 'ready' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600" :
                 "bg-slate-700 text-slate-400 cursor-default"
               )}
               disabled={item.status === 'served' || item.status === 'cancelled'}
             >
               {item.status === 'served' ? 'served' : item.status}
             </button>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-5 pb-5 space-y-2">
        {['served', 'billed', 'paid'].includes(order.status) ? (
          <div className="w-full h-12 border border-slate-600 rounded-xl flex items-center justify-center gap-2 text-slate-400 bg-slate-800/50 font-black text-[13px] uppercase tracking-widest">
            <CheckCircle2 size={16} />
            {order.status === 'paid' ? 'Paid' : order.status === 'billed' ? 'Billed' : 'Served'}
          </div>
        ) : order.status === 'ready' ? (
          <button 
            className="w-full h-12 bg-emerald-500 rounded-xl text-white text-[13px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
            onClick={() => onStatusUpdate(order.id, 'all', order.status)}
          >
            <CheckCircle2 size={16} />
            Mark Served
          </button>
        ) : order.status === 'preparing' ? (
          <button 
            className="w-full h-12 bg-brand-primary rounded-xl text-slate-900 text-[13px] font-black uppercase tracking-widest hover:bg-brand-primary-dark transition-all shadow-lg shadow-brand-primary/10 active:scale-[0.98]"
            onClick={() => onStatusUpdate(order.id, 'all', order.status)}
          >
            Mark All Ready
          </button>
        ) : order.status === 'confirmed' ? (
          <button 
            className="w-full h-12 bg-blue-500 rounded-xl text-white text-[13px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
            onClick={() => onStatusUpdate(order.id, 'all', order.status)}
          >
            <ChefHat size={16} />
            Start Cooking
          </button>
        ) : (
          <button 
            className="w-full h-12 bg-amber-500 rounded-xl text-slate-900 text-[13px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/10 active:scale-[0.98] flex items-center justify-center gap-2"
            onClick={() => onStatusUpdate(order.id, 'all', order.status)}
          >
            <AlertTriangle size={16} />
            Accept Order
          </button>
        )}
      </div>
    </div>
  );
};

import { useRealtimeChannel } from '../../hooks/useRealtimeChannel';
import { playKDSBeep } from '../../utils/sound';

const KDSPage = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [newOrderIds, setNewOrderIds] = useState(new Set());
  const [realtimeStatus, setRealtimeStatus] = useState('connecting');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: branchResponse } = useQuery({
    queryKey: ['branches'],
    queryFn: getBranches,
  });
  
  const effectiveBranchId = user?.branch_id || branchResponse?.branches?.[0]?.id;

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['kds-orders', effectiveBranchId, selectedDate],
    queryFn: () => getKdsOrders({ branch_id: effectiveBranchId, date: selectedDate }),
    enabled: true,
    refetchInterval: 10000,
  });

  const isLoading = ordersLoading || !branchResponse;

  // Local state for orders to allow immediate updates from realtime
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (ordersData) {
      setOrders(Array.isArray(ordersData) ? ordersData : (ordersData.orders || []));
    }
  }, [ordersData]);

  const handleNewOrder = (payload) => {
    console.log('[KDS DEBUG] New order received →', payload);
    const raw = payload.payload;
    // Normalize: ensure 'id' exists (backend may send 'order_id')
    const order = { ...raw, id: raw.id || raw.order_id };
    if (!order.id) return;

    setOrders(prev => {
      if (prev.find(o => o.id === order.id)) return prev;
      return [order, ...prev];
    });
    playKDSBeep();
    queryClient.invalidateQueries(['kds-orders']);
    
    setNewOrderIds(prev => new Set([...prev, order.id]));
    setTimeout(() => {
      setNewOrderIds(prev => {
        const next = new Set(prev);
        next.delete(order.id);
        return next;
      });
    }, 4000);
  };

  const handleOrderUpdate = (payload) => {
    console.log('[KDS DEBUG] Order updated →', payload);
    const updated = payload.payload;
    setOrders(prev =>
      prev.map(order => {
        if (order.id !== updated.order_id && order.id !== updated.id) return order;

        // If order_items are provided, merge them
        let mergedItems = order.order_items || [];
        if (updated.order_items) {
          mergedItems = mergedItems.map(item => {
            const upItem = updated.order_items.find(ui => ui.id === item.id);
            return upItem ? { ...item, ...upItem } : item;
          });
        }

        return { ...order, ...updated, order_items: mergedItems };
      })
    );
    queryClient.invalidateQueries(['kds-orders']);
  };

  const handleStatusChange = (status) => {
    if (status === 'SUBSCRIBED') setRealtimeStatus('connected');
    else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setRealtimeStatus('error');
    else if (status === 'CLOSED') setRealtimeStatus('disconnected');
  };

  // Subscribe to KDS channel
  useRealtimeChannel(effectiveBranchId ? `kds:${effectiveBranchId}` : null, (payload) => {
    if (payload.event === 'new_order') handleNewOrder(payload);
    else if (payload.event === 'order_updated') handleOrderUpdate(payload);
  }, handleStatusChange);

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, itemId, status }) => {
      if (itemId === 'all') {
        return updateKdsOrderStatus(orderId, status);
      } else {
        return updateKdsItemStatus(itemId, status);
      }
    },
    onSuccess: (_, variables) => {
      // Optimistic update already handled if needed, or just refresh
      queryClient.invalidateQueries(['kds-orders']);
      toast.success('Status updated');
    },
    onError: (err) => toast.error(err.message || 'Failed to update status')
  });

  const handleStatusUpdate = (orderId, itemId, currentStatus) => {
    // Determine next status based on current
    let nextStatus;
    if (itemId === 'all') {
      // Order-level: pending→confirmed→preparing→ready→served
      if (currentStatus === 'pending') nextStatus = 'confirmed';
      else if (currentStatus === 'confirmed') nextStatus = 'preparing';
      else if (currentStatus === 'preparing') nextStatus = 'ready';
      else if (currentStatus === 'ready') nextStatus = 'served';
      else return;
    } else {
      // Item-level: pending→preparing→ready→served
      if (currentStatus === 'pending') nextStatus = 'preparing';
      else if (currentStatus === 'preparing') nextStatus = 'ready';
      else if (currentStatus === 'ready') nextStatus = 'served';
      else return; // served/cancelled = terminal
    }
    
    updateStatusMutation.mutate({ orderId, itemId, status: nextStatus });
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    if (filter === 'pending') return order.status === 'pending' || order.status === 'confirmed';
    if (filter === 'preparing') return order.status === 'preparing' || order.order_items?.some(item => item.status === 'preparing');
    if (filter === 'ready') return ['ready', 'served', 'billed', 'paid'].includes(order.status);
    return order.status === filter;
  });

  const StatusPill = () => {
    const configs = {
      connected: { color: 'bg-emerald-500', text: 'Live' },
      connecting: { color: 'bg-amber-500', text: 'Connecting...', pulse: true },
      error: { color: 'bg-red-500', text: 'Reconnecting...' },
      disconnected: { color: 'bg-slate-500', text: 'Offline' }
    };
    const config = configs[realtimeStatus] || configs.connecting;
    
    return (
      <div className={clsx(
        "flex items-center gap-2 px-3 py-1.5 border rounded-full shrink-0",
        realtimeStatus === 'connected' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
        realtimeStatus === 'error' ? "bg-red-500/10 border-red-500/20 text-red-500" :
        "bg-amber-500/10 border-amber-500/20 text-amber-500"
      )}>
        <div className={clsx("h-2 w-2 rounded-full", config.color, (config.pulse || realtimeStatus !== 'connected') && "animate-pulse")} />
        <span className="text-[10px] font-bold uppercase tracking-widest">{config.text}</span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col overflow-hidden z-[100]">
      {/* KDS Header */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-6">
           <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 bg-brand-primary rounded-lg flex items-center justify-center">
                 <UtensilsCrossed size={18} className="text-slate-900" />
              </div>
              <h1 className="text-lg font-bold text-white tracking-tight">Kitchen Display</h1>
           </div>
           
           <div className="h-8 w-px bg-slate-800 mx-2" />

           {/* Date Picker */}
           <div className="flex items-center gap-2">
             <div className="relative flex items-center">
               <CalendarDays size={14} className="absolute left-3 text-slate-500 pointer-events-none" />
               <input
                 type="date"
                 value={selectedDate}
                 onChange={(e) => setSelectedDate(e.target.value)}
                 className="h-9 pl-8 pr-8 rounded-lg bg-slate-950 border border-slate-800 text-[12px] font-bold text-white uppercase tracking-wider focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 transition-all cursor-pointer kds-date-input"
               />
             </div>
             <button
               onClick={() => {
                 const d = new Date();
                 setSelectedDate(d.toISOString().split('T')[0]);
               }}
               className="h-9 px-3 rounded-lg bg-slate-950 border border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-white hover:border-slate-600 transition-all"
             >
               Today
             </button>
           </div>

           <div className="h-8 w-px bg-slate-800 mx-2" />

           <div className="flex items-center gap-2 p-1 bg-slate-950 rounded-xl">
             {['all', 'pending', 'preparing', 'ready'].map(f => {
               const count = f === 'all' ? orders.length :
                 f === 'pending' ? orders.filter(o => o.status === 'pending' || o.status === 'confirmed').length :
                 f === 'preparing' ? orders.filter(o => o.status === 'preparing' || o.order_items?.some(i => i.status === 'preparing')).length :
                 orders.filter(o => ['ready', 'served', 'billed', 'paid'].includes(o.status)).length;
               return (
                 <button
                   key={f}
                   onClick={() => setFilter(f)}
                   className={clsx(
                     "px-4 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5",
                     filter === f ? "bg-slate-800 text-white" : "text-slate-600 hover:text-slate-400"
                   )}
                 >
                   {f === 'ready' ? 'Completed' : f}
                   {count > 0 && (
                     <span className={clsx(
                       "px-1.5 py-0.5 rounded text-[9px] font-black",
                       filter === f ? "bg-brand-primary text-slate-900" : "bg-slate-800 text-slate-400"
                     )}>
                       {count}
                     </span>
                   )}
                 </button>
               );
             })}
           </div>
        </div>

        <div className="flex items-center gap-8">
           <div className="flex items-center gap-3 font-mono">
              <div className="text-right">
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{format(currentTime, 'EEEE')}</p>
                 <p className="text-lg font-bold text-brand-primary leading-none mt-0.5">{format(currentTime, 'HH:mm:ss')}</p>
              </div>
              <Clock size={20} className="text-slate-600" />
           </div>
           
           <StatusPill />
        </div>
      </header>

      {/* Grid Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
             <Spinner size="lg" color="amber" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-20 text-center">
             <ChefHat size={80} className="text-slate-500 mb-6" />
             <h2 className="text-xl font-bold text-slate-400 uppercase tracking-widest">The kitchen is clear</h2>
             <p className="text-sm text-slate-500 mt-2">New orders will appear here automatically</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredOrders.map(order => (
              <KDSOrderCard 
                key={order.id} 
                order={{
                  ...order,
                  isNewOrder: newOrderIds.has(order.id)
                }} 
                onStatusUpdate={handleStatusUpdate}
              />
            ))}
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes newOrderGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); border-color: #1E293B; }
          50% { box-shadow: 0 0 0 6px rgba(16,185,129,0.3); border-color: #10B981; }
        }
        .kds-new-order {
          animation: newOrderGlow 0.8s ease-in-out 3;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #020617;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1E293B;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #334155;
        }
        .kds-date-input::-webkit-calendar-picker-indicator {
          cursor: pointer;
          opacity: 0.5;
          filter: invert(1);
          padding: 4px;
        }
        .kds-date-input::-webkit-calendar-picker-indicator:hover {
          opacity: 0.9;
        }
      `}} />
    </div>
  );
};

export default KDSPage;
