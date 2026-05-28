import React from 'react';
import clsx from 'clsx';
import { format } from 'date-fns';

const DeliveryTimeline = ({ delivery }) => {
  const steps = [
    { id: 'pending', label: 'Pending', time: delivery.created_at },
    { id: 'preparing', label: 'Preparing', time: delivery.preparing_at },
    { id: 'ready_for_pickup', label: 'Ready', time: delivery.ready_at },
    { id: 'picked_up', label: 'Picked Up', time: delivery.picked_up_at },
    { id: 'delivered', label: 'Delivered', time: delivery.delivered_at },
  ];

  const currentStatusIndex = steps.findIndex(s => s.id === delivery.status);
  const isFailed = delivery.status === 'failed';

  return (
    <div className="w-full py-8">
      <div className="relative flex justify-between">
        {/* Progress Bar Background */}
        <div className="absolute top-5 left-0 w-full h-1 bg-slate-100 -z-0" />
        
        {/* Active Progress Bar */}
        {!isFailed && currentStatusIndex !== -1 && (
          <div 
            className="absolute top-5 left-0 h-1 bg-primary-500 transition-all duration-700 -z-0"
            style={{ width: `${(currentStatusIndex / (steps.length - 1)) * 100}%` }}
          />
        )}

        {steps.map((step, index) => {
          const isActive = !isFailed && index <= currentStatusIndex;
          const isCurrent = !isFailed && index === currentStatusIndex;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center group">
              <div className={clsx(
                "h-10 w-10 rounded-2xl flex items-center justify-center transition-all duration-500 border-4",
                isActive ? "bg-primary-500 border-white shadow-lg shadow-primary-500/30 scale-110" : "bg-white border-slate-100",
                isCurrent && "animate-pulse"
              )}>
                <div className={clsx("h-2 w-2 rounded-full", isActive ? "bg-slate-900" : "bg-slate-200")} />
              </div>
              
              <div className="mt-3 text-center">
                <p className={clsx(
                  "text-[10px] font-black uppercase tracking-widest",
                  isActive ? "text-slate-900" : "text-slate-400"
                )}>
                  {step.label}
                </p>
                {step.time && (
                  <p className="text-[9px] font-bold text-slate-400 mt-1">
                    {format(new Date(step.time), 'HH:mm')}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isFailed && (
        <div className="mt-8 bg-rose-50 border border-rose-100 p-6 rounded-[32px] flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="h-12 w-12 bg-rose-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20">
             <div className="h-2 w-2 rounded-full bg-white animate-ping" />
          </div>
          <div>
            <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest leading-none mb-1">Delivery Failed</p>
            <p className="text-xs font-black text-rose-900">Reason: {delivery.failed_reason || 'Unknown error'}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryTimeline;
