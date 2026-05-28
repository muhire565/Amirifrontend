import { Check } from 'lucide-react';
import { ORDER_STATUSES, STATUS_LABELS } from '../../utils/orderStatus';
import { clsx } from 'clsx';

const STEPS = [
  ORDER_STATUSES.CONFIRMED,
  ORDER_STATUSES.PREPARING,
  ORDER_STATUSES.READY,
  ORDER_STATUSES.SERVED,
  ORDER_STATUSES.BILLED,
  ORDER_STATUSES.PAID
];

export default function OrderTimeline({ currentStatus }) {
  const currentIndex = STEPS.indexOf(currentStatus);
  const isVoided = currentStatus === ORDER_STATUSES.VOIDED || currentStatus === ORDER_STATUSES.CANCELLED;

  return (
    <div className="w-full py-8">
      <div className="relative flex items-center justify-between">
        {/* Background Line */}
        <div className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 bg-slate-200" />
        
        {/* Progress Line */}
        {!isVoided && (
          <div 
            className="absolute left-0 top-1/2 h-0.5 bg-primary-500 transition-all duration-500 -translate-y-1/2" 
            style={{ width: `${(Math.max(0, currentIndex) / (STEPS.length - 1)) * 100}%` }}
          />
        )}

        {STEPS.map((step, index) => {
          const isCompleted = !isVoided && index < currentIndex;
          const isCurrent = !isVoided && index === currentIndex;
          const isUpcoming = isVoided || index > currentIndex;

          return (
            <div key={step} className="relative z-10 flex flex-col items-center">
              <div 
                className={clsx(
                  "flex h-10 w-10 items-center justify-center rounded-full border-4 transition-all duration-300",
                  isCompleted && "bg-primary-500 border-primary-500 text-slate-900",
                  isCurrent && "bg-white border-primary-500 text-primary-500 animate-pulse",
                  isUpcoming && "bg-white border-slate-200 text-slate-300"
                )}
              >
                {isCompleted ? <Check size={20} strokeWidth={3} /> : <span className="text-xs font-bold">{index + 1}</span>}
              </div>
              <div className="absolute top-12 whitespace-nowrap text-center">
                <p className={clsx(
                  "text-[10px] font-bold uppercase tracking-wider",
                  isCurrent ? "text-primary-600" : "text-slate-400"
                )}>
                  {STATUS_LABELS[step]}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      
      {isVoided && (
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-full border border-red-100 font-bold text-sm">
            <span className="h-2 w-2 rounded-full bg-red-600 animate-ping" />
            ORDER {currentStatus.toUpperCase()}
          </div>
        </div>
      )}
    </div>
  );
}
