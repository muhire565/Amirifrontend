import React from 'react';
import clsx from 'clsx';

const StockLevelBar = ({ current, threshold, unit }) => {
  const max = Math.max(threshold * 2, current);
  const percentage = Math.min(100, (current / max) * 100);
  
  let barColor = 'bg-emerald-500';
  if (current <= threshold) {
    barColor = 'bg-rose-500';
  } else if (current <= threshold * 1.2) {
    barColor = 'bg-amber-500';
  }

  return (
    <div className="space-y-2">
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
        <div 
          className={clsx("h-full transition-all duration-500", barColor)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
        <span>{current.toLocaleString()} {unit}</span>
        <span>Min: {threshold.toLocaleString()}</span>
      </div>
    </div>
  );
};

export default StockLevelBar;
