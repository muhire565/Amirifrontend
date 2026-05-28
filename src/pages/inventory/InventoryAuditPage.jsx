import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  History, 
  Search, 
  Download, 
  Calendar,
  Filter,
  ArrowUpDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getDeductions, getWastage } from '../../api/inventory.api';
import { useAuthStore } from '../../store/auth.store';
import Spinner from '../../components/ui/Spinner';
import { formatUGX } from '../../utils/currency';
import { format } from 'date-fns';
import clsx from 'clsx';

const InventoryAuditPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('deductions');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data: deductions, isLoading: deductionsLoading } = useQuery({
    queryKey: ['inventory-deductions', user?.branch_id, date],
    queryFn: () => getDeductions({ branch_id: user?.branch_id, date }),
    enabled: activeTab === 'deductions'
  });

  const { data: wastage, isLoading: wastageLoading } = useQuery({
    queryKey: ['inventory-wastage-audit', user?.branch_id, date],
    queryFn: () => getWastage({ branch_id: user?.branch_id, date }),
    enabled: activeTab === 'wastage'
  });

  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(obj => Object.values(obj).join(',')).join('\n');
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}_${date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/inventory')}
          className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Inventory
        </button>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-10 pl-10 pr-4 rounded-xl border-slate-200 text-[10px] font-black uppercase tracking-widest focus:ring-primary-500 bg-white shadow-sm"
            />
          </div>
          <button 
            onClick={() => exportToCSV(activeTab === 'deductions' ? deductions : wastage, activeTab)}
            className="h-10 px-4 flex items-center gap-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10"
          >
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100 bg-slate-50/50 p-2">
          {['deductions', 'wastage'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                "flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all",
                activeTab === tab ? "bg-white text-slate-900 shadow-sm border border-slate-100" : "text-slate-400 hover:text-slate-600"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-8">
          {activeTab === 'deductions' ? (
            deductionsLoading ? <div className="flex justify-center py-20"><Spinner size="lg" /></div> : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-50">
                      <th className="text-left py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Time</th>
                      <th className="text-left py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order #</th>
                      <th className="text-left py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Item</th>
                      <th className="text-left py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Stock Item</th>
                      <th className="text-right py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Deduction</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {(!deductions?.deductions || deductions.deductions.length === 0) ? (
                      <tr><td colSpan="5" className="py-20 text-center text-xs font-bold text-slate-400 uppercase tracking-widest opacity-30">No deductions recorded for this date</td></tr>
                    ) : (
                      deductions.deductions.map((d, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                          <td className="py-4 px-4 text-xs font-bold text-slate-500">{format(new Date(d.created_at), 'HH:mm')}</td>
                          <td className="py-4 px-4 text-xs font-black text-slate-900">#{d.order_number}</td>
                          <td className="py-4 px-4 text-xs font-bold text-slate-600">{d.menu_item_name}</td>
                          <td className="py-4 px-4 text-xs font-bold text-slate-600">{d.stock_item_name}</td>
                          <td className="py-4 px-4 text-right text-xs font-black text-rose-600">-{d.quantity_deducted} {d.unit}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            wastageLoading ? <div className="flex justify-center py-20"><Spinner size="lg" /></div> : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-50">
                      <th className="text-left py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Time</th>
                      <th className="text-left py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Stock Item</th>
                      <th className="text-left py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Reason</th>
                      <th className="text-left py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">By</th>
                      <th className="text-right py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Loss (UGX)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {(!wastage?.wastage || wastage.wastage.length === 0) ? (
                      <tr><td colSpan="5" className="py-20 text-center text-xs font-bold text-slate-400 uppercase tracking-widest opacity-30">No wastage recorded for this date</td></tr>
                    ) : (
                      wastage.wastage.map((w, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                          <td className="py-4 px-4 text-xs font-bold text-slate-500">{format(new Date(w.created_at), 'HH:mm')}</td>
                          <td className="py-4 px-4">
                            <p className="text-xs font-black text-slate-900">{w.stock_item_name}</p>
                            <p className="text-[10px] font-bold text-rose-600">{w.quantity_wasted} {w.unit} wasted</p>
                          </td>
                          <td className="py-4 px-4 text-xs font-bold text-slate-600 capitalize">{w.reason.replace('_', ' ')}</td>
                          <td className="py-4 px-4 text-xs font-bold text-slate-600">{w.recorded_by_name}</td>
                          <td className="py-4 px-4 text-right text-xs font-black text-rose-600">{formatUGX(w.estimated_cost)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryAuditPage;
