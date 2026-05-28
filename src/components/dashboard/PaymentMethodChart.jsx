import React from 'react';
import { Banknote, Smartphone, Phone, Landmark, ShoppingBag } from 'lucide-react';

const METHOD_CONFIG = {
  cash:              { label: 'Cash',             color: '#10B981', bg: '#ECFDF5', Icon: Banknote },
  airtel_money:      { label: 'Airtel Money',     color: '#EF4444', bg: '#FEF2F2', Icon: Smartphone },
  mtn_mobile_money:  { label: 'MTN Mobile Money', color: '#F59E0B', bg: '#FFFBEB', Icon: Phone },
  equity:            { label: 'Equity Bank',      color: '#7C3AED', bg: '#F5F3FF', Icon: Landmark },
  glovo:             { label: 'Glovo',            color: '#06B6D4', bg: '#ECFEFF', Icon: ShoppingBag },
  // legacy key names
  mobile_money_airtel: { label: 'Airtel Money',     color: '#EF4444', bg: '#FEF2F2', Icon: Smartphone },
  mobile_money_mtn:    { label: 'MTN Mobile Money', color: '#F59E0B', bg: '#FFFBEB', Icon: Phone },
};

const PaymentMethodChart = ({ data = [] }) => {
  // data is [{name, value}] — value should be numeric
  const safeData = data.map(item => ({
    ...item,
    // Safely extract numeric value whether it's a number or an object {count, total}
    numericValue: typeof item.value === 'object'
      ? (item.value?.total ?? item.value?.count ?? 0)
      : (Number(item.value) || 0),
  }));

  const total = safeData.reduce((sum, d) => sum + d.numericValue, 0);

  return (
    <div
      className="bg-white rounded-[20px] p-6 h-full"
      style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
    >
      {/* Header */}
      <div className="mb-6">
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#0A0F1E' }}>Payments by Method</h3>
        <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>Today's collection</p>
      </div>

      {/* Rows */}
      <div className="space-y-5">
        {safeData.length === 0 ? (
          <p style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', padding: '24px 0' }}>
            No payment data yet today
          </p>
        ) : (
          safeData.map((item, idx) => {
            // Resolve config by matching the original name against known keys
            const rawKey = Object.keys(METHOD_CONFIG).find(k =>
              item.name.toLowerCase().replace(/\s/g, '_') === k ||
              item.name === METHOD_CONFIG[k]?.label
            );
            const config = rawKey ? METHOD_CONFIG[rawKey] : {
              label: item.name,
              color: '#94A3B8',
              bg: '#F8FAFC',
              Icon: Banknote,
            };
            const pct = total > 0 ? Math.round((item.numericValue / total) * 100) : 0;
            const count = typeof item.value === 'object' ? (item.value?.count ?? 0) : null;

            return (
              <div key={idx}>
                {/* Top row */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="flex items-center justify-center rounded-full shrink-0"
                      style={{ width: 32, height: 32, background: config.bg }}
                    >
                      <config.Icon size={15} color={config.color} strokeWidth={2} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>
                      {config.label}
                    </span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#0A0F1E' }}>
                    UGX {(item.numericValue || 0).toLocaleString()}
                  </span>
                </div>

                {/* Progress bar */}
                <div
                  style={{ height: 6, borderRadius: 3, background: '#F1F5F9', overflow: 'hidden', marginLeft: 42 }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${pct}%`,
                      background: config.color,
                      borderRadius: 3,
                      transition: 'width 800ms ease',
                    }}
                  />
                </div>

                {/* Sub row */}
                <div className="flex justify-between mt-1" style={{ marginLeft: 42 }}>
                  <span style={{ fontSize: 11, color: '#94A3B8' }}>
                    {count !== null ? `${count} transaction${count !== 1 ? 's' : ''}` : `${pct}%`}
                  </span>
                  <span style={{ fontSize: 11, color: '#94A3B8' }}>{pct}%</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default PaymentMethodChart;
