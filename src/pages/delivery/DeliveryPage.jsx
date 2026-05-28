import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Plus, 
  Search, 
  Bike, 
  Calendar,
  Filter,
  MapPin,
  Clock,
  ArrowRight
} from 'lucide-react';
import { getDeliveries } from '../../api/delivery.api';
import { useAuthStore } from '../../store/auth.store';
import DeliveryCard from '../../components/delivery/DeliveryCard';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import clsx from 'clsx';
import PageHeader from '../../components/ui/PageHeader';

const DeliveryPage = () => {
  const { user, hasRole } = useAuthStore();
  const navigate = useNavigate();
  const [status, setStatus] = useState('all');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data: deliveries, isLoading } = useQuery({
    queryKey: ['deliveries', user?.branch_id, status, date],
    queryFn: () => getDeliveries({ 
      branch_id: user?.branch_id, 
      status: status === 'all' ? undefined : status,
      date 
    }),
  });

  const statusFilters = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'preparing', label: 'Preparing' },
    { id: 'ready_for_pickup', label: 'Ready' },
    { id: 'picked_up', label: 'Picked Up' },
    { id: 'delivered', label: 'Delivered' },
    { id: 'failed', label: 'Failed' },
  ];

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  const deliveryList = Array.isArray(deliveries?.deliveries) ? deliveries.deliveries : [];

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Deliveries" 
        subtitle="Dispatch and track customer deliveries"
        rightSlot={
          <>
            {hasRole(['cashier']) && (
              <Button 
                onClick={() => navigate('/delivery/new')} 
                icon={Plus}
                variant="primary"
              >
                New Delivery Order
              </Button>
            )}
            <Link 
              to="/delivery/riders" 
              className="h-10 px-4 flex items-center gap-2 bg-white border border-slate-200 rounded-full text-[12px] font-bold text-slate-500 hover:text-brand-primary transition-all shadow-sm"
            >
              <Bike size={16} /> Riders
            </Link>
          </>
        }
      />

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-wrap gap-2">
          {statusFilters.map(f => (
            <button
              key={f.id}
              onClick={() => setStatus(f.id)}
              className={clsx(
                "px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                status === f.id 
                  ? "bg-slate-900 text-white shadow-lg" 
                  : "bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 pt-4 border-t border-slate-50">
           <div className="relative flex-1">
              <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-2xl border-slate-100 text-[10px] font-black uppercase tracking-widest focus:ring-primary-500 bg-slate-50/50"
              />
           </div>
           <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Showing {deliveryList.length} deliveries
           </div>
        </div>
      </div>

      {/* Grid */}
      {deliveryList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[40px] border border-slate-100 opacity-20">
          <MapPin size={64} className="text-slate-300 mb-4" />
          <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No deliveries found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {deliveryList.map(delivery => (
            <DeliveryCard 
              key={delivery.id} 
              delivery={delivery} 
              onClick={() => navigate(`/delivery/${delivery.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DeliveryPage;
