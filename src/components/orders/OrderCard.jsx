import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, User, Hash } from 'lucide-react';
import { formatUGX } from '../../utils/currency';
import OrderStatusBadge from './OrderStatusBadge';
import { STATUS_COLORS } from '../../utils/orderStatus';
import { clsx } from 'clsx';

export default function OrderCard({ order }) {
  const navigate = useNavigate();
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    const calculateElapsed = () => {
      const start = new Date(order.created_at).getTime();
      const now = new Date().getTime();
      const diff = Math.floor((now - start) / 1000);
      
      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;

      if (hours > 0) return `${hours}h ${minutes}m`;
      return `${minutes}m ${seconds}s`;
    };

    setElapsed(calculateElapsed());
    const interval = setInterval(() => setElapsed(calculateElapsed()), 1000);
    return () => clearInterval(interval);
  }, [order.created_at]);

  const borderColor = `border-l-${STATUS_COLORS[order.status]}-500`;

  return (
    <div 
      onClick={() => navigate(`/orders/${order.id}`)}
      className={clsx(
        "bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden border-l-4",
        borderColor
      )}
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-bold text-slate-400">#{order.order_number.slice(-6).toUpperCase()}</span>
              <OrderStatusBadge status={order.status} />
            </div>
            <h3 className="text-lg font-black text-slate-900 uppercase">Table {order.table_number || 'TBA'}</h3>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-primary-600">{formatUGX(order.total_amount)}</p>
            <div className="flex items-center justify-end gap-1 text-[10px] font-bold text-slate-400 mt-1">
              <Clock size={12} />
              <span>{elapsed} ago</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
              <User size={14} />
            </div>
            <span className="text-xs font-bold text-slate-600">{order.waiter_name || 'Staff'}</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <Hash size={14} />
            <span className="text-xs font-bold">{order.items_count || 0} Items</span>
          </div>
        </div>
      </div>
    </div>
  );
}
