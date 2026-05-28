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
  Package, 
  Trash2, 
  TrendingDown, 
  Calendar, 
  Download,
  AlertTriangle
} from 'lucide-react';
import { getInventoryReport } from '../../api/reports.api';
import { useAuthStore } from '../../store/auth.store';
import MetricCard from '../../components/dashboard/MetricCard';
import Spinner from '../../components/ui/Spinner';
import { formatUGX } from '../../utils/currency';
import { format, startOfMonth, endOfMonth } from 'date-fns';

const InventoryReportPage = () => {
  const { user } = useAuthStore();
  const [dateRange, setDateRange] = useState({
    from: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    to: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });

  const { data: report, isLoading } = useQuery({
    queryKey: ['inventory-report', dateRange],
    queryFn: () => getInventoryReport({ branch_id: user?.branch_id, ...dateRange }),
  });

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tighter">Inventory Analytics</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Stock value, consumption and wastage reports</p>
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard label="Current Stock Value" value={report?.summary?.total_stock_value || 0} theme="revenue" prefix="UGX " />
        <MetricCard label="Wastage Value" value={report?.summary?.total_wastage_value || 0} theme="expenses" prefix="UGX " />
        <MetricCard label="Restock Value" value={report?.summary?.total_restock_value || 0} theme="orders" prefix="UGX " />
        <MetricCard label="Low Stock Items" value={report?.summary?.low_stock_count || 0} theme="pending" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Top Consumed Ingredients */}
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
           <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter mb-8">Top Consumed Ingredients</h3>
           <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={report?.top_consumed || []} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} width={100} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} />
                    <Bar dataKey="total_deducted" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24} />
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Wastage Breakdown */}
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
           <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter mb-8">Highest Wastage Items</h3>
           <div className="space-y-6">
              {(report?.top_wastage || []).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-rose-50 border border-rose-100">
                   <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-rose-500 shadow-sm">
                         <Trash2 size={20} />
                      </div>
                      <div>
                         <p className="text-xs font-black text-slate-900">{item.name}</p>
                         <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">{item.total_wasted} {item.unit} lost</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-sm font-black text-rose-700">{formatUGX(item.estimated_cost)}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Est. Financial Loss</p>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* Current Stock Levels Table */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
           <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter">Current Stock Levels</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-slate-50">
                <th className="py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Item Name</th>
                <th className="py-5 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Stock</th>
                <th className="py-5 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Min Threshold</th>
                <th className="py-5 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="py-5 px-8 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Inventory Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {report?.stock_levels?.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-8 text-xs font-black text-slate-900">{item.name}</td>
                  <td className="py-4 px-4 text-xs font-bold text-slate-600">{item.current_quantity} {item.unit}</td>
                  <td className="py-4 px-4 text-xs font-bold text-slate-400">{item.minimum_threshold} {item.unit}</td>
                  <td className="py-4 px-4">
                     {item.current_quantity <= item.minimum_threshold ? (
                       <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 text-[9px] font-black uppercase tracking-widest">Low Stock</span>
                     ) : (
                       <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-widest">Healthy</span>
                     )}
                  </td>
                  <td className="py-4 px-8 text-right text-xs font-black text-slate-900">{formatUGX(item.stock_value)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
               <tr className="bg-slate-900 text-white">
                  <td colSpan="4" className="py-5 px-8 text-[10px] font-black uppercase tracking-widest">Total Valuation</td>
                  <td className="py-5 px-8 text-right text-lg font-black">{formatUGX(report?.summary?.total_stock_value || 0)}</td>
               </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InventoryReportPage;
