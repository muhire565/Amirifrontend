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
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { 
  Utensils, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Download,
  Flame,
  Snowflake
} from 'lucide-react';
import { getMenuReport } from '../../api/reports.api';
import { useAuthStore } from '../../store/auth.store';
import MetricCard from '../../components/dashboard/MetricCard';
import Spinner from '../../components/ui/Spinner';
import { formatUGX } from '../../utils/currency';
import { format, startOfMonth, endOfMonth } from 'date-fns';

const MenuReportPage = () => {
  const { user } = useAuthStore();
  const [dateRange, setDateRange] = useState({
    from: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    to: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });

  const { data: report, isLoading } = useQuery({
    queryKey: ['menu-report', dateRange],
    queryFn: () => getMenuReport({ branch_id: user?.branch_id, ...dateRange }),
  });

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tighter">Menu Analysis</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Top sellers, category revenue and item performance</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Hot Sellers */}
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 opacity-5">
             <Flame size={120} className="text-orange-500" />
           </div>
           <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter mb-8 flex items-center gap-2">
              <Flame size={18} className="text-orange-500" /> Hot Sellers
           </h3>
           <div className="space-y-6 relative z-10">
              {(report?.top_sellers || []).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-5 rounded-3xl bg-slate-50 border border-slate-100 group hover:border-primary-500 transition-all">
                   <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-slate-900 font-black shadow-sm">
                         {idx + 1}
                      </div>
                      <div>
                         <p className="text-xs font-black text-slate-900">{item.name}</p>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.category}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-sm font-black text-emerald-600">{formatUGX(item.revenue)}</p>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.quantity_sold} units</p>
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* Cold Items */}
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 opacity-5">
             <Snowflake size={120} className="text-blue-500" />
           </div>
           <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter mb-8 flex items-center gap-2">
              <Snowflake size={18} className="text-blue-500" /> Underperforming
           </h3>
           <div className="space-y-6 relative z-10">
              {(report?.bottom_sellers || []).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-5 rounded-3xl bg-slate-50 border border-slate-100 group hover:border-rose-500 transition-all">
                   <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-slate-400 font-black shadow-sm">
                         {idx + 1}
                      </div>
                      <div>
                         <p className="text-xs font-black text-slate-900">{item.name}</p>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.category}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-sm font-black text-rose-500">{formatUGX(item.revenue)}</p>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.quantity_sold} units</p>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
         {/* Category Revenue */}
         <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter mb-8">Revenue by Category</h3>
            <div className="h-64 w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report?.category_revenue || []}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} />
                     <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
                     <Tooltip cursor={{ fill: '#f8fafc' }} />
                     <Bar dataKey="revenue" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Volume Distribution */}
         <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col items-center justify-center">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter mb-8 self-start">Sales Volume Distribution</h3>
            <div className="h-64 w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie
                        data={report?.category_volume || []}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                     >
                        {(report?.category_volume || []).map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'][index % 5]} />
                        ))}
                     </Pie>
                     <Tooltip />
                  </PieChart>
               </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-6 mt-4">
                {(report?.category_volume || []).map((entry, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'][index % 5] }} />
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{entry.name}</span>
                  </div>
                ))}
            </div>
         </div>
      </div>
    </div>
  );
};

export default MenuReportPage;
