import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Users, 
  Search, 
  Calendar, 
  Filter, 
  Download,
  Star,
  Clock,
  TrendingUp,
  Award
} from 'lucide-react';
import { getStaffReport } from '../../api/reports.api';
import { useAuthStore } from '../../store/auth.store';
import Spinner from '../../components/ui/Spinner';
import { formatUGX } from '../../utils/currency';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import clsx from 'clsx';

const StaffReportPage = () => {
  const { user } = useAuthStore();
  const [dateRange, setDateRange] = useState({
    from: format(startOfWeek(new Date()), 'yyyy-MM-dd'),
    to: format(endOfWeek(new Date()), 'yyyy-MM-dd')
  });
  const [activeRole, setActiveRole] = useState('waiter');

  const { data: report, isLoading } = useQuery({
    queryKey: ['staff-report', dateRange, activeRole],
    queryFn: () => getStaffReport({ branch_id: user?.branch_id, role: activeRole, ...dateRange }),
  });

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tighter">Staff Performance</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Monitor efficiency and service quality</p>
        </div>

        <div className="flex items-center gap-3">
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
      </div>

      {/* Role Selection */}
      <div className="flex gap-4">
        {['waiter', 'cashier', 'chef', 'rider'].map(role => (
          <button
            key={role}
            onClick={() => setActiveRole(role)}
            className={clsx(
              "px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
              activeRole === role 
                ? "bg-slate-900 text-white shadow-xl shadow-slate-900/10" 
                : "bg-white border border-slate-100 text-slate-400 hover:text-slate-600 hover:border-slate-200"
            )}
          >
            {role}s
          </button>
        ))}
      </div>

      {/* Leaderboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {report?.top_performers?.map((staff, idx) => (
           <div key={staff.id} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <Award size={120} />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                   <div className={clsx(
                     "h-12 w-12 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg",
                     idx === 0 ? "bg-amber-500 shadow-amber-500/20" : idx === 1 ? "bg-slate-400 shadow-slate-400/20" : "bg-orange-400 shadow-orange-400/20"
                   )}>
                     {idx + 1}
                   </div>
                   <div>
                     <h3 className="text-lg font-black text-slate-900 tracking-tight">{staff.full_name}</h3>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Top Performer</p>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Volume</p>
                    <p className="text-xl font-black text-slate-900">{staff.metric_value} {staff.metric_label}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Impact</p>
                    <p className="text-xl font-black text-emerald-600">{formatUGX(staff.revenue_impact)}</p>
                  </div>
                </div>
              </div>
           </div>
        ))}
      </div>

      {/* Full Report Table */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
           <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter">Full Staff Metrics</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-slate-50">
                <th className="py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Staff Name</th>
                <th className="py-5 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Tasks Completed</th>
                <th className="py-5 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Avg Speed</th>
                <th className="py-5 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Days Active</th>
                <th className="py-5 px-8 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Revenue (UGX)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {report?.staff_metrics?.map((staff, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-8">
                    <p className="text-xs font-black text-slate-900">{staff.full_name}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{staff.branch_name}</p>
                  </td>
                  <td className="py-4 px-4 text-xs font-black text-slate-900 text-center">{staff.tasks_completed}</td>
                  <td className="py-4 px-4 text-xs font-bold text-slate-600 text-center">{staff.avg_speed_minutes}m</td>
                  <td className="py-4 px-4 text-xs font-bold text-slate-600 text-center">{staff.days_active}</td>
                  <td className="py-4 px-8 text-right text-xs font-black text-emerald-600">{formatUGX(staff.revenue_generated)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StaffReportPage;
