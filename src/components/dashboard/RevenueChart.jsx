import React, { useState } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import clsx from 'clsx';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-2xl">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">{label}</p>
        <div className="space-y-2">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-8">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-[13px] font-medium text-slate-600">{entry.name}</span>
              </div>
              <span className="text-[13px] font-bold text-slate-900">
                UGX {entry.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const RevenueChart = ({ data = [] }) => {
  const [period, setPeriod] = useState('Today');

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-card h-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-[15px] font-bold text-slate-900 tracking-tight">Revenue Trend</h3>
          <p className="text-[11px] text-slate-400 font-medium uppercase tracking-widest mt-0.5">Performance over time</p>
        </div>
        
        <div className="flex p-1 bg-slate-50 rounded-xl">
          {['Today', 'Week', 'Month'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={clsx(
                "px-4 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all",
                period === p 
                  ? "bg-white text-brand-primary shadow-sm" 
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis 
              dataKey="time" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fontWeight: 600, fill: '#94A3B8' }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fontWeight: 600, fill: '#94A3B8' }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="top" 
              align="right" 
              iconType="circle" 
              iconSize={8}
              wrapperStyle={{ paddingBottom: 20, fontSize: 12, fontWeight: 600, color: '#64748B' }}
            />
            <Line 
              name="Dine-In"
              type="monotone" 
              dataKey="dine_in" 
              stroke="#F59E0B" 
              strokeWidth={3} 
              dot={false}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
            <Line 
              name="Delivery"
              type="monotone" 
              dataKey="delivery" 
              stroke="#8B5CF6" 
              strokeWidth={3} 
              dot={false}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
            <Line 
              name="Takeaway"
              type="monotone" 
              dataKey="takeaway" 
              stroke="#10B981" 
              strokeWidth={3} 
              dot={false}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RevenueChart;
