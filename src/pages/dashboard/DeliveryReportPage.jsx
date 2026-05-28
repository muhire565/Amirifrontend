import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  Truck, 
  MapPin, 
  Clock, 
  Calendar, 
  Download,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Bike
} from 'lucide-react';
import { getDeliveryReport } from '../../api/reports.api';
import { useAuthStore } from '../../store/auth.store';
import MetricCard from '../../components/dashboard/MetricCard';
import Spinner from '../../components/ui/Spinner';
import { formatUGX } from '../../utils/currency';
import { format, startOfMonth, endOfMonth } from 'date-fns';

const DeliveryReportPage = () => {
  const { user } = useAuthStore();
  const [dateRange, setDateRange] = useState({
    from: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    to: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });

  const { data: report, isLoading } = useQuery({
    queryKey: ['delivery-report', dateRange],
    queryFn: () => getDeliveryReport({ branch_id: user?.branch_id, ...dateRange }),
  });

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tighter">Delivery Insights</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Dispatch volume, success rates and zone performance</p>
        </div>

        <div className="flex bg-white rounded-2xl border border-slate-200 p-1 shadow-sm">
           <div className="flex items-center px-3 border-r border-slate-100">
             <Calendar size={14} className="text-slate-400 mr-2" />
             <input 
              type="date" 
              value={dateRange.from} 
              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest focus:ring-0 w-28"
             />
           </div>
           <div className="flex items-center px-3">
             <input 
              type="date" 
              value={dateRange.to} 
              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest focus:ring-0 w-28"
             />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Total Deliveries" value={report?.summary?.total_count || 0} color="default" />
        <MetricCard label="Completed" value={report?.summary?.completed_count || 0} color="green" />
        <MetricCard label="Failed" value={report?.summary?.failed_count || 0} color={report?.summary?.failed_count > 0 ? 'red' : 'default'} />
        <MetricCard label="Delivery Revenue" value={report?.summary?.total_revenue || 0} isCurrency color="purple" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Zone Performance */}
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
           <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter mb-8">Top Delivery Zones</h3>
           <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                 <BarChart data={report?.zone_performance || []} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                    <YAxis dataKey="zone" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} width={100} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} />
                    <Bar dataKey="order_count" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={24} />
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Rider Leaderboard */}
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter">Rider Standings</h3>
              <div className="h-8 w-8 bg-slate-900 text-white rounded-lg flex items-center justify-center">
                 <Bike size={18} />
              </div>
           </div>
           <div className="space-y-4">
              {(report?.rider_rankings || []).map((rider, idx) => (
                <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                   <div className={clsx(
                     "h-10 w-10 rounded-xl flex items-center justify-center font-black text-sm shadow-sm",
                     idx === 0 ? "bg-amber-500 text-white" : "bg-white text-slate-400"
                   )}>
                      {idx + 1}
                   </div>
                   <div className="flex-1">
                      <p className="text-xs font-black text-slate-900">{rider.full_name}</p>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{rider.completed_trips} trips completed</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                        {Math.round(rider.success_rate)}% SUCCESS
                      </p>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* Breakdown Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-[40px] flex flex-col items-center text-center">
            <div className="h-14 w-14 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-4">
               <CheckCircle2 size={28} />
            </div>
            <h4 className="text-xl font-black text-emerald-900 tracking-tighter mb-1">High Reliability</h4>
            <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest max-w-[200px]">Successful fulfillment rate across all zones is {report?.summary?.success_rate}%</p>
         </div>

         <div className="bg-slate-900 p-8 rounded-[40px] flex flex-col items-center text-center text-white">
            <div className="h-14 w-14 bg-white/10 text-primary-500 rounded-2xl flex items-center justify-center mb-4">
               <Clock size={28} />
            </div>
            <h4 className="text-xl font-black tracking-tighter mb-1">Avg. Delivery Time</h4>
            <p className="text-3xl font-black text-primary-500 tracking-tighter mb-1">{report?.summary?.avg_delivery_minutes}m</p>
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Minutes from prep to door</p>
         </div>

         <div className="bg-rose-50 border border-rose-100 p-8 rounded-[40px] flex flex-col items-center text-center">
            <div className="h-14 w-14 bg-rose-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20 mb-4">
               <XCircle size={28} />
            </div>
            <h4 className="text-xl font-black text-rose-900 tracking-tighter mb-1">Lost Revenue</h4>
            <p className="text-xl font-black text-rose-700 tracking-tighter">{formatUGX(report?.summary?.failed_revenue || 0)}</p>
            <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest max-w-[200px]">Potential revenue lost due to {report?.summary?.failed_count} failed deliveries</p>
         </div>
      </div>
    </div>
  );
};

export default DeliveryReportPage;
