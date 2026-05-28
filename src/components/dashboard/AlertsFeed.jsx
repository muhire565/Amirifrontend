import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  ShoppingCart, 
  Check, 
  CreditCard, 
  Ban, 
  Bike, 
  MapPin, 
  Package,
  Bell,
  X
} from 'lucide-react';
import clsx from 'clsx';
import { useRealtimeChannel } from '../../hooks/useRealtimeChannel';
import { format } from 'date-fns';

const ALERT_CONFIGS = {
  low_stock_alert: { icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
  new_order: { icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
  order_ready: { icon: Check, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  payment_received: { icon: CreditCard, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  void_request: { icon: Ban, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
  rider_assigned: { icon: Bike, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
  delivery_completed: { icon: MapPin, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  delivery_failed: { icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
  stock_restocked: { icon: Package, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
};

const AlertsFeed = () => {
  const [alerts, setAlerts] = useState([]);
  const [isLive, setIsLive] = useState(false);

  useRealtimeChannel('owner:alerts', (event, payload) => {
    const newAlert = {
      id: Date.now(),
      type: event,
      message: payload.message || `New ${event.replace('_', ' ')} alert`,
      timestamp: new Date(),
      isNew: true
    };

    setAlerts(prev => [newAlert, ...prev].slice(0, 50));
    setIsLive(true);
    
    // Clear the "new" flash effect after 1.5s
    setTimeout(() => {
      setAlerts(current => current.map(a => a.id === newAlert.id ? { ...a, isNew: false } : a));
    }, 1500);
  });

  const clearAll = () => setAlerts([]);
  const removeAlert = (id) => setAlerts(prev => prev.filter(a => a.id !== id));

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col h-full overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bell size={18} className="text-slate-900" />
            <div className={clsx(
              "absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white animate-pulse",
              isLive ? "bg-emerald-500" : "bg-slate-300"
            )} />
          </div>
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter">Live Alerts</h3>
        </div>
        <button 
          onClick={clearAll}
          className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors"
        >
          Clear All
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-10 opacity-20">
            <Bell size={48} className="text-slate-300 mb-4" />
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-relaxed">
              No live alerts yet.<br />Listening for system events...
            </p>
          </div>
        ) : (
          alerts.map(alert => {
            const config = ALERT_CONFIGS[alert.type] || { icon: Bell, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-100' };
            const Icon = config.icon;

            return (
              <div 
                key={alert.id}
                className={clsx(
                  "p-4 rounded-2xl border transition-all duration-1000 flex gap-4 relative group",
                  config.bg,
                  config.border,
                  alert.isNew ? "scale-[1.02] shadow-lg z-10" : "scale-100"
                )}
              >
                <div className={clsx("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", "bg-white shadow-sm", config.color)}>
                  <Icon size={20} />
                </div>
                <div className="flex-1 pr-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                      {alert.type.replace('_', ' ')}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400">
                      {format(alert.timestamp, 'HH:mm')}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-900 leading-relaxed">{alert.message}</p>
                </div>
                <button 
                  onClick={() => removeAlert(alert.id)}
                  className="absolute top-2 right-2 p-1 text-slate-300 hover:text-slate-900 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <X size={14} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AlertsFeed;
