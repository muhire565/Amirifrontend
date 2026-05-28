import React from 'react';

const PageHeader = ({ title, subtitle, rightSlot }) => {
  return (
    <div className="h-16 border-b border-slate-100 flex items-center justify-between mb-8">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {rightSlot && (
        <div className="flex items-center gap-3">
          {rightSlot}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
