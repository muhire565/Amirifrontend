import React from 'react';
import clsx from 'clsx';

const Spinner = ({ size = 'md', color = 'amber', className }) => {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-10 h-10",
  };

  const colors = {
    amber: "stroke-brand-primary",
    white: "stroke-white",
  };

  return (
    <div className={clsx("flex items-center justify-center", className)}>
      <svg 
        className={clsx("animate-spin", sizes[size])} 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle 
          className="opacity-25 stroke-current" 
          cx="12" cy="12" r="10" 
          strokeWidth="3"
        />
        <circle 
          className={clsx("opacity-100 stroke-current", colors[color])}
          cx="12" cy="12" r="10" 
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="31.4"
          strokeDashoffset="31.4"
          style={{
            strokeDasharray: '62.8',
            strokeDashoffset: '40'
          }}
        />
      </svg>
    </div>
  );
};

export default Spinner;
