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
  Building2, 
  TrendingUp, 
  MapPin, 
  Calendar, 
  ChevronRight,
  Target,
  Award,
  Users,
  ShoppingBag
} from 'lucide-react';
import { getBranchComparison } from '../../api/reports.api';
import { useAuthStore } from '../../store/auth.store';
import Spinner from '../../components/ui/Spinner';
import { formatUGX } from '../../utils/currency';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import clsx from 'clsx';

const BranchComparePage = () => {
  const { user } = useAuthStore();
  const [dateRange, setDateRange] = useState({
    from: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    to: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });

  const { data: branches, isLoading } = useQuery({
    queryKey: ['branch-comparison', dateRange],
    queryFn: () => getBranchComparison(dateRange),
  });

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  const sortedBranches = [...(branches || [])].sort((a, b) => b.revenue - a.revenue);
  const topBranch = sortedBranches[0];

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tighter">Branch Comparison</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Cross-branch performance benchmarking</p>
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

      <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
         <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter mb-8">Revenue Breakdown by Branch</h3>
         <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
               <BarChart data={sortedBranches}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} tickFormatter={(v) => `${(v/1000000).toFixed(1)}M`} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={50}>
                     {sortedBranches.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#f59e0b' : '#3b82f6'} />
                     ))}
                  </Bar>
               </BarChart>
            </ResponsiveContainer>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {sortedBranches.map((branch, idx) => (
          <div key={branch.id} className={clsx(
            "bg-white rounded-[40px] border p-8 shadow-sm relative overflow-hidden group transition-all duration-500",
            idx === 0 ? "border-amber-200 ring-2 ring-amber-50" : "border-slate-100"
          )}>
            {idx === 0 && (
              <div className="absolute top-4 right-4 bg-amber-500 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/20 animate-bounce">
                TOP BRANCH
              </div>
            )}
            
            <div className="flex items-center gap-4 mb-8">
               <div className={clsx(
                 "h-12 w-12 rounded-2xl flex items-center justify-center text-white shadow-lg",
                 idx === 0 ? "bg-amber-500 shadow-amber-500/20" : "bg-slate-900 shadow-slate-900/20"
               )}>
                  <Building2 size={24} />
               </div>
               <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">{branch.name}</h3>
                  <div className="flex items-center gap-1 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                     <MapPin size={10} /> {branch.location}
                  </div>
               </div>
            </div>

            <div className="space-y-6">
               <div className="p-5 rounded-3xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Revenue</p>
                  <p className="text-2xl font-black text-slate-900 tracking-tighter">{formatUGX(branch.revenue)}</p>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl border border-slate-50">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                        <ShoppingBag size={10} className="text-primary-500" /> Orders
                     </p>
                     <p className="text-lg font-black text-slate-900">{branch.order_count}</p>
                  </div>
                  <div className="p-4 rounded-2xl border border-slate-50">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                        <Target size={10} className="text-emerald-500" /> Avg Order
                     </p>
                     <p className="text-lg font-black text-slate-900">{formatUGX(branch.avg_order)}</p>
                  </div>
               </div>

               <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <div className="flex items-center gap-2">
                     <Users size={14} className="text-slate-400" />
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{branch.staff_count} Staff Members</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-black text-rose-500 uppercase tracking-widest">
                     <AlertCircle size={14} />
                     <span>{branch.active_alerts} Alerts</span>
                  </div>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BranchComparePage;
