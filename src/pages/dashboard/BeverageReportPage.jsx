import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Wine, Download, Calendar, TrendingUp, Package,
  AlertTriangle, Hash, ChevronDown, ChevronRight
} from 'lucide-react';
import { getBeverageReport } from '../../api/reports.api';
import { useAuthStore } from '../../store/auth.store';
import MetricCard from '../../components/dashboard/MetricCard';
import Spinner from '../../components/ui/Spinner';
import { formatUGX } from '../../utils/currency';
import { format } from 'date-fns';
import clsx from 'clsx';

const BeverageReportPage = () => {
  const { user } = useAuthStore();
  const today = new Date().toISOString().split('T')[0];
  const [dateRange, setDateRange] = useState({ from: today, to: today });
  const [expandedCat, setExpandedCat] = useState(null);

  const { data: report, isLoading } = useQuery({
    queryKey: ['beverage-report', dateRange],
    queryFn: () => getBeverageReport({ branch_id: user?.branch_id, ...dateRange }),
  });

  const exportCSV = () => {
    if (!report?.top_sellers?.length) return;
    const headers = "Item,Category,Quantity Sold,Revenue\n";
    const rows = report.top_sellers.map(i =>
      `"${i.name}","${i.category}",${i.quantity},${i.revenue}`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `beverage_report_${dateRange.from}_to_${dateRange.to}.csv`;
    a.click();
  };

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  const summary = report?.summary || {};
  const categories = report?.categories || [];
  const topSellers = report?.top_sellers || [];
  const dailyBreakdown = report?.daily_breakdown || [];
  const stockLevels = report?.stock_levels || [];

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white shadow-xl shadow-purple-200">
            <Wine size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Beverage Sales</h1>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Revenue from drinks & beverages</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-white rounded-2xl border border-slate-200 p-1 shadow-sm">
            <div className="flex items-center px-3 border-r border-slate-100">
              <Calendar size={14} className="text-slate-400 mr-2" />
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                className="bg-transparent border-none text-[11px] font-bold focus:ring-0 w-28 text-slate-700"
              />
            </div>
            <div className="flex items-center px-3">
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                className="bg-transparent border-none text-[11px] font-bold focus:ring-0 w-28 text-slate-700"
              />
            </div>
          </div>
          <button
            onClick={() => setDateRange({ from: today, to: today })}
            className="h-10 px-4 rounded-xl border border-slate-200 text-[11px] font-bold text-slate-500 hover:bg-slate-50 transition-all bg-white"
          >
            Today
          </button>
          <button
            onClick={exportCSV}
            className="h-10 px-5 flex items-center gap-2 bg-slate-900 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10"
          >
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <MetricCard label="Beverage Revenue" value={summary.total_revenue || 0} theme="revenue" prefix="UGX " />
        <MetricCard label="Units Sold" value={summary.total_quantity || 0} theme="orders" />
        <MetricCard label="Categories" value={summary.category_count || 0} theme="avg" />
        <MetricCard label="Unique Items" value={summary.item_count || 0} theme="pending" />
        <MetricCard label="Low Stock" value={summary.low_stock_count || 0} theme="expenses" />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">

        {/* Left: Category Breakdown */}
        <div className="bg-white rounded-[20px] border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-purple-50 flex items-center justify-center">
                <Wine size={16} className="text-purple-500" />
              </div>
              <div>
                <h3 className="text-[14px] font-black text-slate-900">Revenue by Category</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Click to expand items</p>
              </div>
            </div>
          </div>

          {categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 opacity-40">
              <Wine size={48} className="text-slate-300 mb-3" />
              <p className="text-[13px] font-bold text-slate-500">No beverage sales found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {categories.map((cat, idx) => {
                const isExpanded = expandedCat === cat.name;
                const pct = summary.total_revenue > 0 ? ((cat.revenue / summary.total_revenue) * 100).toFixed(1) : 0;
                return (
                  <div key={cat.name}>
                    <button
                      onClick={() => setExpandedCat(isExpanded ? null : cat.name)}
                      className="w-full px-6 py-4 flex items-center gap-4 hover:bg-slate-50/50 transition-colors text-left"
                    >
                      <div
                        className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-black text-[13px] shrink-0 shadow-sm"
                        style={{
                          background: `hsl(${(idx * 55 + 260) % 360}, 65%, 55%)`
                        }}
                      >
                        {cat.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[14px] font-bold text-slate-900 truncate">{cat.name}</p>
                          <p className="text-[14px] font-black text-slate-900 shrink-0 ml-3">{formatUGX(cat.revenue)}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] font-bold text-slate-400">{cat.quantity} units sold</p>
                          <p className="text-[11px] font-bold text-purple-500">{pct}%</p>
                        </div>
                        <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${pct}%`,
                              background: `hsl(${(idx * 55 + 260) % 360}, 65%, 55%)`
                            }}
                          />
                        </div>
                      </div>
                      <div className="shrink-0 text-slate-300">
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="bg-slate-50/50 px-6 pb-4 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                        {cat.items.map((item, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between py-2.5 px-4 bg-white rounded-xl border border-slate-100"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-black text-slate-400 w-5">#{i + 1}</span>
                              <p className="text-[13px] font-bold text-slate-700">{item.name}</p>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-[11px] font-bold text-slate-400">{item.quantity} sold</span>
                              <span className="text-[13px] font-black text-slate-900">{formatUGX(item.revenue)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Top Sellers & Stock */}
        <div className="space-y-6">
          {/* Top Sellers */}
          <div className="bg-white rounded-[20px] border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-[14px] font-black text-slate-900">Top Selling Beverages</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">By quantity</p>
            </div>
            <div className="p-4 space-y-2">
              {topSellers.length === 0 ? (
                <p className="text-center text-[12px] text-slate-400 py-8">No data available</p>
              ) : (
                topSellers.slice(0, 8).map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <div
                      className="flex items-center justify-center h-8 w-8 rounded-lg text-[11px] font-black shrink-0"
                      style={{
                        background: idx < 3 ? 'linear-gradient(135deg, #7C3AED, #DB2777)' : '#F1F5F9',
                        color: idx < 3 ? 'white' : '#64748B',
                      }}
                    >
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-slate-800 truncate">{item.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.category}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[13px] font-black text-slate-900">{formatUGX(item.revenue)}</p>
                      <p className="text-[10px] font-bold text-slate-400">{item.quantity} sold</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Stock Levels */}
          <div className="bg-white rounded-[20px] border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-[14px] font-black text-slate-900">Current Stock</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Beverage inventory</p>
              </div>
              {summary.low_stock_count > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 border border-red-100 rounded-lg">
                  <AlertTriangle size={11} className="text-red-500" />
                  <span className="text-[10px] font-black text-red-600">{summary.low_stock_count} low</span>
                </div>
              )}
            </div>
            <div className="p-4 space-y-2 max-h-[320px] overflow-y-auto">
              {stockLevels.length === 0 ? (
                <p className="text-center text-[12px] text-slate-400 py-8">No tracked beverages</p>
              ) : (
                stockLevels.map((item, idx) => (
                  <div
                    key={idx}
                    className={clsx(
                      "flex items-center justify-between p-3 rounded-xl border transition-colors",
                      item.is_low ? "bg-red-50/50 border-red-100" : "bg-white border-slate-100 hover:bg-slate-50"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={clsx(
                        "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                        item.is_low ? "bg-red-100" : "bg-slate-100"
                      )}>
                        <Package size={14} className={item.is_low ? "text-red-500" : "text-slate-500"} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold text-slate-800 truncate">{item.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.category}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className={clsx(
                        "text-[15px] font-black",
                        item.is_low ? "text-red-600" : "text-slate-900"
                      )}>
                        {item.current_stock}
                      </p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">min: {item.low_stock_threshold}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Daily Breakdown Table */}
      {dailyBreakdown.length > 0 && (
        <div className="bg-white rounded-[20px] border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-[14px] font-black text-slate-900">Daily Breakdown</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Beverage sales by day</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="py-3.5 px-6 text-left text-[11px] font-black text-slate-500 uppercase tracking-widest">Date</th>
                  <th className="py-3.5 px-6 text-right text-[11px] font-black text-slate-500 uppercase tracking-widest">Units Sold</th>
                  <th className="py-3.5 px-6 text-right text-[11px] font-black text-slate-500 uppercase tracking-widest">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {dailyBreakdown.map((day, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-6 text-[13px] font-bold text-slate-800">
                      {format(new Date(day.date + 'T00:00:00'), 'EEE, dd MMM yyyy')}
                    </td>
                    <td className="py-3 px-6 text-right text-[13px] font-bold text-slate-600">{day.quantity}</td>
                    <td className="py-3 px-6 text-right text-[14px] font-black text-emerald-600">{formatUGX(day.revenue)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 border-t border-slate-200">
                  <td className="py-3 px-6 text-[12px] font-black text-slate-900 uppercase tracking-widest">Total</td>
                  <td className="py-3 px-6 text-right text-[13px] font-black text-slate-900">{summary.total_quantity}</td>
                  <td className="py-3 px-6 text-right text-[14px] font-black text-emerald-700">{formatUGX(summary.total_revenue)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default BeverageReportPage;
