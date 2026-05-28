import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Bike, 
  Calendar, 
  Phone, 
  Star, 
  TrendingUp,
  MapPin,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getRiders } from '../../api/delivery.api';
import { useAuthStore } from '../../store/auth.store';
import Spinner from '../../components/ui/Spinner';
import { formatUGX } from '../../utils/currency';
import clsx from 'clsx';

const RidersPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const { data, isLoading } = useQuery({
    queryKey: ['riders-performance', user?.branch_id, date],
    queryFn: () => getRiders({ branch_id: user?.branch_id, date }),
  });

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/delivery')}
            className="h-12 w-12 flex items-center justify-center bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 transition-all shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tighter">Rider Performance</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Track delivery efficiency and success rates</p>
          </div>
        </div>

        <div className="relative">
          <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-12 pl-10 pr-4 rounded-2xl border-slate-200 text-[10px] font-black uppercase tracking-widest focus:ring-primary-500 bg-white shadow-sm"
          />
        </div>
      </div>

      {data?.riders?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[40px] border border-slate-100 opacity-20 text-center">
          <Bike size={64} className="text-slate-300 mb-4" />
          <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No rider activity recorded for this date</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {data?.riders?.map(rider => {
            const successRate = (rider.deliveries_completed / (rider.deliveries_completed + rider.deliveries_failed || 1)) * 100;
            
            return (
              <div key={rider.id} className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500">
                <div className="p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div className="h-14 w-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-primary-500 group-hover:text-slate-900 transition-colors duration-500 shadow-inner">
                      <Bike size={28} />
                    </div>
                    <div className={clsx(
                      "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm",
                      successRate >= 90 ? "bg-emerald-100 text-emerald-700" : successRate >= 70 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
                    )}>
                      {Math.round(successRate)}% Success
                    </div>
                  </div>

                  <h3 className="text-lg font-black text-slate-900 tracking-tight mb-1">{rider.full_name}</h3>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">
                    <Phone size={12} className="text-primary-500" />
                    <span>{rider.phone}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                         <CheckCircle2 size={10} className="text-emerald-500" /> Completed
                       </p>
                       <p className="text-xl font-black text-slate-900">{rider.deliveries_completed}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                         <XCircle size={10} className="text-rose-500" /> Failed
                       </p>
                       <p className="text-xl font-black text-slate-900">{rider.deliveries_failed}</p>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                     <div>
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Revenue Generated</p>
                       <p className="text-sm font-black text-emerald-600">{formatUGX(rider.total_value_delivered)}</p>
                     </div>
                     <a 
                      href={`tel:${rider.phone}`}
                      className="h-10 w-10 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20"
                    >
                       <Phone size={18} />
                     </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RidersPage;
