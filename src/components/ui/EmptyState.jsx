import React from 'react';
import { Inbox } from 'lucide-react';
import Button from './Button';

const EmptyState = ({ 
  icon: Icon = Inbox, 
  heading = "No data found", 
  subtext = "There are no items to display right now.",
  actionLabel,
  onAction
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center max-w-sm mx-auto">
      <div className="h-12 w-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 mb-4 shadow-sm">
        <Icon size={24} strokeWidth={1.5} />
      </div>
      <h3 className="text-[15px] font-semibold text-slate-900 tracking-tight">
        {heading}
      </h3>
      <p className="text-[13px] text-slate-400 mt-1 leading-relaxed">
        {subtext}
      </p>
      {actionLabel && onAction && (
        <Button 
          variant="primary" 
          onClick={onAction}
          className="mt-6"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
