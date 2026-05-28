import React from 'react';
import clsx from 'clsx';

const Input = React.forwardRef(({ 
  label, 
  error, 
  className, 
  id,
  type = 'text',
  ...props 
}, ref) => {
  return (
    <div className="space-y-1.5">
      {label && (
        <label 
          htmlFor={id} 
          className="block text-[13px] font-medium text-slate-700"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          id={id}
          type={type}
          className={clsx(
            "w-full h-[42px] px-3.5 rounded-lg border text-[14px] text-slate-800 placeholder:text-slate-400 transition-all focus:outline-none focus:ring-4 bg-white",
            error 
              ? "border-red-400 focus:ring-red-500/10 focus:border-red-400" 
              : "border-slate-200 focus:ring-amber-500/10 focus:border-amber-400",
            className
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="text-[11px] text-red-500 font-medium ml-1">
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
