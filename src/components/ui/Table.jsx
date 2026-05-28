import React from 'react';
import clsx from 'clsx';
import EmptyState from './EmptyState';

/**
 * Modern Table Component
 * Supports two modes:
 * 1. Column-based: Pass 'columns' array with { label, render, key }
 * 2. Manual: Pass 'headers' and 'renderRow'
 */
const Table = ({ 
  columns,
  headers, 
  data = [], 
  renderRow, 
  loading,
  isLoading,
  emptyMessage = "No records found",
  emptySubtitle = "Try adjusting your filters or search"
}) => {
  const isloading = loading || isLoading;
  const tableHeaders = columns ? columns.map(c => c.label) : headers;

  if (!tableHeaders) {
    console.error("Table component requires either 'columns' or 'headers' prop.");
    return null;
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 h-12 border-b border-slate-200">
              {tableHeaders.map((header, i) => (
                <th 
                  key={i}
                  className="px-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isloading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="h-16 animate-pulse">
                  {tableHeaders.map((_, j) => (
                    <td key={j} className="px-6">
                      <div className="h-3 bg-slate-100 rounded-full w-24" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data && data.length > 0 ? (
              data.map((item, i) => (
                <tr 
                  key={item.id || i} 
                  className="h-16 hover:bg-slate-50/30 transition-colors cursor-default"
                >
                  {columns ? (
                    columns.map((col, j) => (
                      <td key={j} className="px-6 text-sm text-slate-600">
                        {col.render ? col.render(item[col.key], item) : item[col.key]}
                      </td>
                    ))
                  ) : (
                    renderRow(item, i)
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={tableHeaders.length}>
                  <div className="py-20">
                    <EmptyState 
                      heading={emptyMessage}
                      subtext={emptySubtitle}
                    />
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;
