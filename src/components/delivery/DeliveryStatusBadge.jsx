import React from 'react';
import clsx from 'clsx';

const DeliveryStatusBadge = ({ status }) => {
  const configs = {
    pending: { label: 'Pending', bg: 'bg-slate-100', text: 'text-slate-600' },
    preparing: { label: 'Preparing', bg: 'bg-amber-100', text: 'text-amber-700' },
    ready_for_pickup: { label: 'Ready for Pickup', bg: 'bg-blue-100', text: 'text-blue-700' },
    picked_up: { label: 'Picked Up', bg: 'bg-purple-100', text: 'text-purple-700' },
    delivered: { label: 'Delivered', bg: 'bg-emerald-100', text: 'text-emerald-700' },
    failed: { label: 'Failed', bg: 'bg-rose-100', text: 'text-rose-700' },
  };

  const config = configs[status] || configs.pending;

  return (
    <span className={clsx(
      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center",
      config.bg,
      config.text
    )}>
      {config.label}
    </span>
  );
};

export default DeliveryStatusBadge;
