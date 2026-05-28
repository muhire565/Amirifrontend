import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Wallet, Trash2, Search, Calendar, ArrowLeft, User, FileText, Clock } from 'lucide-react';
import { getExpenses, deleteExpense } from '../../api/expenses.api';
import { useAuthStore } from '../../store/auth.store';
import { formatUGX } from '../../utils/currency';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import Spinner from '../../components/ui/Spinner';

export default function ExpensesPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['expenses', date],
    queryFn: () => getExpenses({ date }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['expenses']);
      queryClient.invalidateQueries(['owner-metrics']);
      toast.success('Expense deleted');
    },
    onError: (err) => toast.error(err.message || 'Failed to delete expense'),
  });

  const expenses = (data?.expenses || []).map(e => ({
    ...e,
    cashier_name: e.cashier_name || e.cashier?.full_name || '-',
  })).filter(e => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      e.recipient?.toLowerCase().includes(q) ||
      e.description?.toLowerCase().includes(q) ||
      e.cashier_name?.toLowerCase().includes(q)
    );
  });

  const totalAmount = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="h-10 w-10 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:border-slate-300 transition-all"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Expenses</h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              All recorded expenses — {format(new Date(date), 'EEEE, dd MMMM yyyy')}
            </p>
          </div>
        </div>

        {/* Summary badge */}
        <div className="flex items-center gap-3">
          <div className="bg-rose-50 border border-rose-100 rounded-2xl px-5 py-3 flex items-center gap-3">
            <Wallet size={20} className="text-rose-500" />
            <div>
              <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Total Expenses</p>
              <p className="text-lg font-black text-rose-600">{formatUGX(totalAmount)}</p>
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Count</p>
            <p className="text-lg font-black text-slate-700">{expenses.length}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex items-center gap-2 flex-1 bg-white border border-slate-200 rounded-xl px-4 h-11">
          <Search size={16} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search by recipient, description, cashier..."
            className="flex-1 border-none bg-transparent text-sm font-medium focus:ring-0 outline-none placeholder:text-slate-300"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 h-11">
            <Calendar size={16} className="text-slate-400" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border-none bg-transparent text-sm font-bold text-slate-700 focus:ring-0 outline-none"
            />
          </div>
          <button
            onClick={() => setDate(format(new Date(), 'yyyy-MM-dd'))}
            className="h-11 px-4 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-colors"
          >
            Today
          </button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : expenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 opacity-40">
          <Wallet size={56} className="text-slate-300 mb-4" />
          <p className="text-sm font-bold text-slate-500">No expenses recorded for this date</p>
        </div>
      ) : (
        <div className="bg-white rounded-[20px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Recipient</th>
                  <th className="text-left px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                  <th className="text-left px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                  <th className="text-left px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Recorded By</th>
                  <th className="text-left px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Time</th>
                  <th className="text-right px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense, idx) => (
                  <tr
                    key={expense.id}
                    className={clsx(
                      "transition-colors hover:bg-slate-50/50",
                      idx !== expenses.length - 1 && "border-b border-slate-50"
                    )}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                          <User size={16} />
                        </div>
                        <span className="text-sm font-bold text-slate-900">{expense.recipient}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 max-w-[280px]">
                        <FileText size={14} className="text-slate-300 shrink-0" />
                        <span className="text-sm text-slate-600 font-medium truncate">{expense.description}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-black text-rose-600 tabular-nums">{formatUGX(expense.amount)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-slate-500">{expense.cashier_name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Clock size={13} />
                        <span className="text-xs font-bold">{format(new Date(expense.created_at), 'HH:mm')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          if (confirm('Delete this expense?')) deleteMutation.mutate(expense.id);
                        }}
                        className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-100 bg-slate-50/50">
                  <td className="px-6 py-4" colSpan={2}>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Total</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-base font-black text-rose-600">{formatUGX(totalAmount)}</span>
                  </td>
                  <td colSpan={3} className="px-6 py-4 text-right">
                    <span className="text-xs font-bold text-slate-400">{expenses.length} expense(s)</span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
