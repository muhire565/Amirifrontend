import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTables } from '../../api/tables.api';
import { useAuthStore } from '../../store/auth.store';
import clsx from 'clsx';

const ActiveOrdersMap = ({ branchId }) => {
  const { data: tables, isLoading } = useQuery({
    queryKey: ['tables-mini', branchId],
    queryFn: () => getTables({ branch_id: branchId }),
    refetchInterval: 30000, // 30 seconds
  });

  if (isLoading) return <div className="h-40 flex items-center justify-center opacity-20 italic text-[10px] uppercase font-black">Loading Map...</div>;

  const tableList = tables?.tables || [];
  const occupiedCount = tableList.filter(t => t.status === 'occupied').length || 0;
  const totalCount = tableList.length || 0;

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter text-left">Floor Snapshot</h3>
        <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest">{occupiedCount}/{totalCount} OCCUPIED</span>
      </div>

      <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
        {tableList.map(table => (
          <div 
            key={table.id}
            title={`Table ${table.table_number}: ${table.status}`}
            className={clsx(
              "h-8 w-full rounded-lg transition-all duration-300 border-2",
              table.status === 'occupied' ? "bg-amber-500 border-amber-600 shadow-lg shadow-amber-500/20" : 
              table.status === 'cleaning' ? "bg-slate-200 border-slate-300" :
              "bg-emerald-500 border-emerald-600 shadow-lg shadow-emerald-500/10"
            )}
          />
        ))}
      </div>
      
      <div className="mt-6 flex items-center gap-4 border-t border-slate-50 pt-4">
         <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Available</span>
         </div>
         <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-amber-500" />
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Occupied</span>
         </div>
         <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-slate-300" />
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cleaning</span>
         </div>
      </div>
    </div>
  );
};

export default ActiveOrdersMap;
