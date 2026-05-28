import React from 'react';
import { Package, Trash2, PlusCircle, AlertCircle } from 'lucide-react';
import StockLevelBar from './StockLevelBar';
import { formatUGX } from '../../utils/currency';
import clsx from 'clsx';

const StockItemCard = ({ item, onRestock, onWastage, canManage }) => {
  const isLow = item.current_quantity <= item.minimum_threshold;

  return (
    <div className={clsx(
      "bg-white rounded-2xl border transition-all duration-300 overflow-hidden shadow-card hover:shadow-card-hover hover:-translate-y-0.5",
      isLow ? "border-red-200 ring-2 ring-red-50" : "border-slate-100"
    )}>
      <div className="p-6">
        <div className="flex justify-between items-start mb-5">
          <div className="min-w-0">
            <h3 className="text-[14px] font-bold text-slate-900 tracking-tight truncate mb-1">{item.name}</h3>
            <span className="inline-flex px-2 py-0.5 bg-slate-50 border border-slate-100 rounded-md text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              {item.unit}
            </span>
          </div>
          {isLow && (
            <div className="flex items-center gap-1.5 bg-red-50 text-red-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm shrink-0">
              <AlertCircle size={12} strokeWidth={2.5} />
              <span>Low Stock</span>
            </div>
          )}
        </div>

        <div className="mb-6">
           <StockLevelBar 
            current={item.current_quantity} 
            threshold={item.minimum_threshold} 
            unit={item.unit} 
          />
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Cost / Unit</p>
            <p className="text-[13px] font-bold text-slate-900">{formatUGX(item.cost_per_unit)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Value</p>
            <p className="text-[13px] font-bold text-emerald-600">{formatUGX(item.current_quantity * item.cost_per_unit)}</p>
          </div>
        </div>
      </div>

      {canManage && (
        <div className="flex border-t border-slate-50 bg-slate-50/30">
          <button 
            onClick={() => onRestock(item)}
            className="flex-1 py-3.5 flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-600 hover:text-brand-primary hover:bg-white transition-all"
          >
            <PlusCircle size={14} />
            Restock
          </button>
          <div className="w-[1px] bg-slate-100 h-full self-stretch" />
          <button 
            onClick={() => onWastage(item)}
            className="flex-1 py-3.5 flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-600 hover:text-red-500 hover:bg-white transition-all"
          >
            <Trash2 size={14} />
            Wastage
          </button>
        </div>
      )}
    </div>
  );
};

export default StockItemCard;

