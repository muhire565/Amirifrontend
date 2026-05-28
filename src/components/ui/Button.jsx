import React from 'react';
import clsx from 'clsx';
import Spinner from './Spinner';

const Button = ({ 
  children, 
  variant = 'primary', 
  size,
  className, 
  loading, 
  disabled, 
  icon: Icon,
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-full text-[13px] font-semibold transition-all active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none h-10 px-5 gap-2";
  
  const variants = {
    primary: "bg-amber-500 text-white hover:bg-amber-600 shadow-sm shadow-amber-200",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-sm",
    danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
    outline: "bg-transparent text-slate-700 border border-slate-200 hover:bg-slate-50",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
  };

  const sizes = {
    sm: "h-8 px-3 text-[12px]",
    md: "h-10 px-5 text-[13px]",
    lg: "h-12 px-6 text-[14px]",
  };

  return (
    <button 
      className={clsx(baseStyles, variants[variant], size && sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Spinner size="sm" color={variant === 'primary' || variant === 'danger' ? 'white' : 'amber'} />
      ) : (
        <>
          {Icon && <Icon size={16} />}
          {children}
        </>
      )}
    </button>
  );
};

export default Button;
