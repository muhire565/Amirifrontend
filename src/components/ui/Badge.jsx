import React from 'react';
import clsx from 'clsx';

const Badge = ({ children, variant = 'slate', className }) => {
  const variants = {
    amber: "bg-[#FEF3C7] text-[#92400E]",
    blue: "bg-[#DBEAFE] text-[#1E40AF]",
    violet: "bg-[#EDE9FE] text-[#5B21B6]",
    emerald: "bg-[#D1FAE5] text-[#065F46]",
    orange: "bg-[#FFEDD5] text-[#9A3412]",
    slate: "bg-[#F1F5F9] text-[#334155]",
    red: "bg-[#FEF2F2] text-[#B91C1C]",
    teal: "bg-[#E0F2F1] text-[#00695C]",
  };

  return (
    <span className={clsx(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium uppercase tracking-wider",
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
};

export default Badge;
