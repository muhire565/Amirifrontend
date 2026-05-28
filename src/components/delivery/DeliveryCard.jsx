import React from 'react';
import { MapPin, Phone, User, Clock, ArrowRight } from 'lucide-react';
import DeliveryStatusBadge from './DeliveryStatusBadge';
import { formatUGX } from '../../utils/currency';
import { format } from 'date-fns';

const DeliveryCard = ({ delivery, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="flex justify-between items-start mb-4">
        <DeliveryStatusBadge status={delivery.status} />
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">#{delivery.order_number}</span>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-black text-slate-900 group-hover:text-primary-600 transition-colors">{delivery.customer_name}</h3>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
            <MapPin size={12} className="text-primary-500" />
            <span className="truncate">{delivery.delivery_address}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
              <User size={14} />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Rider</p>
              <p className="text-[10px] font-bold text-slate-900">{delivery.rider_name || 'Not assigned'}</p>
            </div>
          </div>
          <div className="text-right">
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total</p>
             <p className="text-xs font-black text-slate-900">{formatUGX(delivery.total_amount)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryCard;
