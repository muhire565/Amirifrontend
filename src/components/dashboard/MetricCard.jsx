import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { TrendingUp } from 'lucide-react';

// Premium gradient MetricCard — each variant has its own gradient identity
const CARD_THEMES = {
  revenue: {
    gradient: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
    shadow: '0 4px 24px rgba(79,70,229,0.30)',
    iconColor: 'rgba(255,255,255,0.25)',
  },
  orders: {
    gradient: 'linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%)',
    shadow: '0 4px 24px rgba(6,182,212,0.30)',
    iconColor: 'rgba(255,255,255,0.25)',
  },
  avg: {
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
    shadow: '0 4px 24px rgba(245,158,11,0.30)',
    iconColor: 'rgba(255,255,255,0.25)',
  },
  pending: {
    gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    shadow: '0 4px 24px rgba(16,185,129,0.30)',
    iconColor: 'rgba(255,255,255,0.25)',
  },
  expenses: {
    gradient: 'linear-gradient(135deg, #E11D48 0%, #BE123C 100%)',
    shadow: '0 4px 24px rgba(225,29,72,0.30)',
    iconColor: 'rgba(255,255,255,0.25)',
  },
};

const MetricCard = ({ 
  label, 
  value, 
  icon: Icon, 
  theme = 'revenue',
  delta,
  prefix = '',
  sublabel = '',
  isPending = false,
  isLoading = false,
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const numericValue = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.]/g, '')) || 0;
  const card = CARD_THEMES[theme] || CARD_THEMES.revenue;

  useEffect(() => {
    if (numericValue === 0) { setDisplayValue(0); return; }
    let start = 0;
    const total = 800;
    const step = numericValue / (total / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= numericValue) { setDisplayValue(numericValue); clearInterval(timer); }
      else { setDisplayValue(Math.floor(start)); }
    }, 16);
    return () => clearInterval(timer);
  }, [numericValue]);

  if (isLoading) {
    return (
      <div className="skeleton rounded-[20px]" style={{ minHeight: 140 }} />
    );
  }

  return (
    <div
      className={clsx(
        'relative rounded-[20px] p-6 overflow-hidden cursor-default select-none',
        'transition-all duration-200 hover:-translate-y-1',
        isPending && displayValue > 0 && 'pending-glow'
      )}
      style={{ background: card.gradient, boxShadow: card.shadow, minHeight: 140 }}
    >
      {/* Decorative circles */}
      <div style={{
        position: 'absolute', right: -30, bottom: -30,
        width: 160, height: 160, borderRadius: '50%',
        background: 'rgba(255,255,255,0.07)', pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', right: 30, bottom: -50,
        width: 100, height: 100, borderRadius: '50%',
        background: 'rgba(255,255,255,0.05)', pointerEvents: 'none'
      }} />

      {/* Decorative icon (background) */}
      {Icon && (
        <div style={{
          position: 'absolute', right: -8, bottom: -8,
          opacity: 0.15, pointerEvents: 'none'
        }}>
          <Icon size={80} strokeWidth={1.5} color="white" />
        </div>
      )}

      {/* Top row: label + trend */}
      <div className="flex items-start justify-between mb-4 relative z-10">
        <span style={{
          fontSize: 10, fontWeight: 600, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)'
        }}>
          {label}
        </span>
        {delta && (
          <span style={{
            background: 'rgba(255,255,255,0.20)', color: 'white',
            fontSize: 11, fontWeight: 700, borderRadius: 20,
            padding: '2px 8px', letterSpacing: '0.03em'
          }}>
            {delta.type === 'up' ? '+' : '-'}{delta.value}%
          </span>
        )}
      </div>

      {/* Value */}
      <div className="relative z-10">
        <p style={{ fontSize: 30, fontWeight: 700, color: 'white', lineHeight: 1, letterSpacing: '-0.02em' }}>
          {prefix}{displayValue.toLocaleString()}
        </p>
        {sublabel && (
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 6, fontWeight: 500 }}>
            {sublabel}
          </p>
        )}
      </div>
    </div>
  );
};

export default MetricCard;
