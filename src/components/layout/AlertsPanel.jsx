import React from 'react';
import { 
  X, 
  Bell, 
  Package, 
  ShoppingBag, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle,
  Bike,
  MapPin,
  Trash2,
  Ban,
  Wallet
} from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';
import { useRealtimeChannel } from '../../hooks/useRealtimeChannel';
import EmptyState from '../ui/EmptyState';

const ALERT_CONFIGS = {
  low_stock: { icon: AlertTriangle, color: 'bg-red-50 text-red-500', label: 'Low Stock' },
  payment_received: { icon: Wallet, color: 'bg-emerald-50 text-emerald-500', label: 'Payment' },
  new_order: { icon: ShoppingBag, color: 'bg-blue-50 text-blue-500', label: 'New Order' },
  order_ready: { icon: CheckCircle2, color: 'bg-teal-50 text-teal-500', label: 'Order Ready' },
  void_request: { icon: Ban, color: 'bg-amber-50 text-amber-500', label: 'Void Request' },
  rider_assigned: { icon: Bike, color: 'bg-violet-50 text-violet-500', label: 'Rider Assigned' },
  delivery_completed: { icon: MapPin, color: 'bg-emerald-50 text-emerald-600', label: 'Delivered' },
  delivery_failed: { icon: AlertCircle, color: 'bg-red-50 text-red-500', label: 'Delivery Failed' },
  stock_restocked: { icon: Package, color: 'bg-teal-50 text-teal-500', label: 'Restock' },
};

const AlertsPanel = ({ isOpen, onClose, alerts = [], onClear }) => {
  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/20 backdrop-blur-[2px] z-40 lg:hidden" 
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div className={clsx(
        "fixed top-0 right-0 h-full w-full sm:w-[360px] bg-white shadow-2xl z-50 transition-transform duration-300 transform",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Live Alerts</h2>
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 rounded-full">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Live</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {alerts.length > 0 && (
                <button 
                  onClick={onClear}
                  className="text-[11px] font-bold text-red-500 uppercase tracking-wider hover:text-red-600 transition-colors mr-2"
                >
                  Clear all
                </button>
              )}
              <button 
                onClick={onClose}
                className="h-8 w-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto bg-slate-50/30">
            {alerts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-20 px-10">
                <EmptyState 
                  icon={Bell}
                  heading="No alerts yet"
                  subtext="The system is listening for real-time updates. New activity will appear here."
                />
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {alerts.map((alert, i) => {
                  const config = ALERT_CONFIGS[alert.type] || { icon: Bell, color: 'bg-slate-50 text-slate-500', label: 'Alert' };
                  const Icon = config.icon;
                  
                  return (
                    <div 
                      key={alert.id || i} 
                      className="p-5 bg-white hover:bg-slate-50 transition-colors group relative overflow-hidden"
                    >
                      {/* New Alert Flash Animation Effect */}
                      {i === 0 && (
                        <div className="absolute inset-0 bg-brand-primary-light/10 animate-out fade-out duration-1000 fill-mode-forwards pointer-events-none" />
                      )}

                      <div className="flex gap-4 relative">
                        <div className={clsx(
                          "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                          config.color
                        )}>
                          <Icon size={20} strokeWidth={1.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2 mb-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              {config.label}
                            </span>
                            <span className="text-[10px] font-medium text-slate-400">
                              {format(new Date(alert.created_at || new Date()), 'HH:mm')}
                            </span>
                          </div>
                          <p className="text-[13px] font-medium text-slate-700 leading-snug">
                            {alert.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 bg-white">
            <p className="text-center text-[10px] font-medium text-slate-400 uppercase tracking-widest">
              Amiri POS Real-time Engine
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default AlertsPanel;
