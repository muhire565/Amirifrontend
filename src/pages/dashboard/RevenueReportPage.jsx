import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  TrendingUp, 
  Download, 
  Calendar, 
  ChevronRight,
  Filter,
  BarChart3,
  PieChart
} from 'lucide-react';
import { getRevenueReport } from '../../api/reports.api';
import { useAuthStore } from '../../store/auth.store';
import MetricCard from '../../components/dashboard/MetricCard';
import RevenueChart from '../../components/dashboard/RevenueChart';
import Spinner from '../../components/ui/Spinner';
import { formatUGX } from '../../utils/currency';
import { format, startOfMonth, endOfMonth } from 'date-fns';

const RevenueReportPage = () => {
  const { user } = useAuthStore();
  const [dateRange, setDateRange] = useState({
    from: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    to: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });

  const { data: report, isLoading } = useQuery({
    queryKey: ['revenue-report', dateRange],
    queryFn: () => getRevenueReport({ branch_id: user?.branch_id, ...dateRange }),
  });

  const exportCSV = () => {
    if (!report?.breakdown) return;
    const headers = "Date,Total,Dine-In,Delivery,Takeaway,Orders,Avg Order\n";
    const rows = report.breakdown.map(d => 
      `${d.date},${d.total},${d.dine_in},${d.delivery},${d.takeaway},${d.order_count},${d.avg_order_value}`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revenue_report_${dateRange.from}_to_${dateRange.to}.csv`;
    a.click();
  };

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tighter">Revenue Analysis</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Deep dive into sales performance</p>
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
          <button 
            onClick={exportCSV}
            className="h-12 px-6 flex items-center gap-2 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10"
          >
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard label="Total Revenue" value={report?.totals?.total || 0} theme="revenue" prefix="UGX " />
        <MetricCard label="Dine-In" value={report?.totals?.dine_in || 0} theme="revenue" prefix="UGX " />
        <MetricCard label="Delivery" value={report?.totals?.delivery || 0} theme="orders" prefix="UGX " />
        <MetricCard label="Takeaway" value={report?.totals?.takeaway || 0} theme="avg" prefix="UGX " />
        <MetricCard label="Order Count" value={report?.totals?.order_count || 0} theme="pending" />
        <MetricCard label="Avg Order" value={report?.totals?.avg_order_value || 0} theme="expenses" prefix="UGX " />
      </div>

      <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
        <RevenueChart data={(report?.breakdown || []).map(d => ({ time: d.date, dine_in: d.dine_in, delivery: d.delivery, takeaway: d.takeaway })).reverse()} />
      </div>

      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
           <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter">Daily Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-slate-50">
                <th className="py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                <th className="py-5 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Revenue</th>
                <th className="py-5 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Dine-In</th>
                <th className="py-5 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Delivery</th>
                <th className="py-5 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Takeaway</th>
                <th className="py-5 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Orders</th>
                <th className="py-5 px-8 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg Order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(report?.breakdown || []).map((day, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-8 text-xs font-black text-slate-900">{day.date}</td>
                  <td className="py-4 px-4 text-xs font-black text-emerald-600">{formatUGX(day.total)}</td>
                  <td className="py-4 px-4 text-xs font-bold text-slate-600 text-center">{formatUGX(day.dine_in)}</td>
                  <td className="py-4 px-4 text-xs font-bold text-slate-600 text-center">{formatUGX(day.delivery)}</td>
                  <td className="py-4 px-4 text-xs font-bold text-slate-600 text-center">{formatUGX(day.takeaway)}</td>
                  <td className="py-4 px-4 text-xs font-black text-slate-900 text-center">{day.order_count}</td>
                  <td className="py-4 px-8 text-right text-xs font-black text-slate-900">{formatUGX(day.avg_order_value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RevenueReportPage;
