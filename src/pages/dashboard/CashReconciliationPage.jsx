import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Calculator, 
  Printer, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Calendar,
  Search,
  User,
  ShieldCheck,
  Ban,
  Wallet,
  Trash2,
  Plus,
  Receipt
} from 'lucide-react';
import { getCashReconciliation, getVoidRequests } from '../../api/reports.api';
import { reviewVoid } from '../../api/orders.api';
import { createExpense, deleteExpense } from '../../api/expenses.api';
import { useAuthStore } from '../../store/auth.store';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import { formatUGX } from '../../utils/currency';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const CashReconciliationPage = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ amount: '', description: '', recipient: '' });

  const { data: reconciliation, isLoading: recLoading } = useQuery({
    queryKey: ['cash-reconciliation', user?.branch_id, date],
    queryFn: () => getCashReconciliation({ branch_id: user?.branch_id, date }),
  });

  const { data: voidRequests, isLoading: voidLoading } = useQuery({
    queryKey: ['void-requests', user?.branch_id, date],
    queryFn: () => getVoidRequests({ branch_id: user?.branch_id, date }),
  });

  const expenseMutation = useMutation({
    mutationFn: (data) => createExpense(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['cash-reconciliation']);
      setExpenseForm({ amount: '', description: '', recipient: '' });
      setShowExpenseForm(false);
      toast.success('Expense recorded!');
    },
    onError: (err) => toast.error(err.message || 'Failed to record expense')
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (id) => deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['cash-reconciliation']);
      toast.success('Expense deleted');
    },
    onError: (err) => toast.error(err.message || 'Failed to delete expense')
  });

  const handleAddExpense = () => {
    if (!expenseForm.amount || !expenseForm.description || !expenseForm.recipient) {
      return toast.error('All fields are required');
    }
    if (parseFloat(expenseForm.amount) <= 0) return toast.error('Amount must be greater than 0');
    expenseMutation.mutate({
      amount: parseFloat(expenseForm.amount),
      description: expenseForm.description.trim(),
      recipient: expenseForm.recipient.trim(),
    });
  };

  const voidMutation = useMutation({
    mutationFn: ({ orderId, decision }) => reviewVoid(orderId, decision),
    onSuccess: () => {
      queryClient.invalidateQueries(['void-requests', user?.branch_id, date]);
      queryClient.invalidateQueries(['cash-reconciliation', user?.branch_id, date]);
      toast.success('Void request reviewed successfully');
    },
    onError: (err) => toast.error(err.message || 'Failed to review void')
  });

  const handlePrint = () => window.print();

  if (recLoading || voidLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-8 pb-20 print:p-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tighter">Cash Reconciliation</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Audit daily cash collections and voided orders</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
             <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
             <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)}
              className="h-12 pl-10 pr-4 rounded-2xl border-slate-200 text-[10px] font-black uppercase tracking-widest focus:ring-primary-500 bg-white shadow-sm"
             />
          </div>
          <Button onClick={handlePrint} variant="secondary" className="rounded-2xl h-12 px-6">
            <Printer size={18} className="mr-2" /> Print Audit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main Reconciliation Audit (2/3) */}
        <div className="xl:col-span-2 space-y-8">
           <div className="bg-emerald-900 text-white rounded-[40px] p-10 shadow-xl shadow-emerald-900/20 relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                 <div>
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">Total Cash Expected in Drawer</p>
                    <h2 className="text-5xl font-black tracking-tighter">{formatUGX(reconciliation?.cash_expected_in_drawer || 0)}</h2>
                    <div className="flex items-center gap-2 mt-6 text-emerald-400">
                       <ShieldCheck size={16} />
                       <span className="text-[10px] font-black uppercase tracking-widest">Financial Integrity Verified</span>
                    </div>
                 </div>
                 <div className="bg-white/10 backdrop-blur-md rounded-[32px] p-6 border border-white/10 space-y-4 min-w-[240px]">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                       <span className="text-emerald-400">💵 Cash Sales</span>
                       <span>{formatUGX(reconciliation?.breakdown?.cash || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                       <span className="text-red-400">📱 Airtel Money</span>
                       <span>{formatUGX(reconciliation?.breakdown?.airtel || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                       <span className="text-amber-400">📲 MTN MoMo</span>
                       <span>{formatUGX(reconciliation?.breakdown?.mtn || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                       <span className="text-violet-300">🏦 Equity Bank</span>
                       <span>{formatUGX(reconciliation?.breakdown?.equity || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                       <span className="text-teal-300">🛵 Glovo Pay</span>
                       <span>{formatUGX(reconciliation?.breakdown?.glovo || 0)}</span>
                    </div>
                    <div className="pt-4 border-t border-white/10 flex justify-between items-center text-xs font-black uppercase tracking-widest">
                       <span>Total Revenue</span>
                       <span className="text-primary-400">{formatUGX(reconciliation?.total_revenue || 0)}</span>
                    </div>
                 </div>
              </div>
              <div className="absolute top-0 right-0 p-10 opacity-5">
                 <Calculator size={200} />
              </div>
           </div>

           <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                 <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter">Daily Voids Audit</h3>
                 <div className="flex items-center gap-2 px-3 py-1 bg-rose-50 text-rose-600 rounded-full">
                    <Ban size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{reconciliation?.voids?.count || 0} Voids Total</span>
                 </div>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full">
                    <thead>
                       <tr className="text-left border-b border-slate-50">
                          <th className="py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order #</th>
                          <th className="py-5 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cashier</th>
                          <th className="py-5 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Reason</th>
                          <th className="py-5 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                          <th className="py-5 px-8 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Value (UGX)</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {!Array.isArray(voidRequests) || voidRequests.length === 0 ? (
                          <tr><td colSpan="5" className="py-20 text-center text-xs font-bold text-slate-400 uppercase tracking-widest opacity-20">No voided orders recorded for this date</td></tr>
                        ) : (
                          voidRequests.map(v => (
                           <tr key={v.id} className={clsx("hover:bg-slate-50 transition-colors", v.status === 'pending' && "bg-amber-50/50")}>
                              <td className="py-5 px-8 text-xs font-black text-slate-900">#{v.order_number}</td>
                              <td className="py-5 px-4">
                                 <p className="text-xs font-bold text-slate-900">{v.cashier_name}</p>
                                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{format(new Date(v.created_at), 'HH:mm')}</p>
                              </td>
                              <td className="py-5 px-4">
                                 <p className="text-xs font-bold text-slate-600 line-clamp-1">{v.reason}</p>
                              </td>
                              <td className="py-5 px-4 text-center">
                                 <span className={clsx(
                                   "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                                   v.status === 'approved' ? "bg-emerald-100 text-emerald-700" : v.status === 'rejected' ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                                 )}>
                                   {v.status}
                                 </span>
                              </td>
                              <td className="py-5 px-8 text-right text-xs font-black text-slate-900">{formatUGX(v.total_amount)}</td>
                           </tr>
                         ))
                       )}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>

        {/* Action Required Sidebar (1/3) */}
        <div className="space-y-8 print:hidden">
           <div className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                 <div className="h-10 w-10 bg-amber-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                    <AlertTriangle size={20} />
                 </div>
                 <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter">Review Pending Voids</h3>
              </div>

              <div className="space-y-6">
                 {(!Array.isArray(voidRequests) || voidRequests.filter(v => v.status === 'pending').length === 0) ? (
                   <div className="text-center py-10 opacity-30">
                      <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-3" />
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">All void requests have been reviewed</p>
                   </div>
                 ) : (
                   voidRequests.filter(v => v.status === 'pending').map(v => (
                     <div key={v.id} className="p-6 rounded-3xl bg-slate-50 border border-slate-100 space-y-4">
                        <div className="flex justify-between items-start">
                           <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Order {v.order_number}</p>
                              <p className="text-lg font-black text-slate-900 tracking-tighter">{formatUGX(v.total_amount)}</p>
                           </div>
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{format(new Date(v.created_at), 'HH:mm')}</span>
                        </div>
                        
                        <div>
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Reason for void</p>
                           <p className="text-xs font-bold text-slate-600 italic leading-relaxed">"{v.reason}"</p>
                        </div>

                        <div className="flex gap-2 pt-2">
                           <button 
                            onClick={() => voidMutation.mutate({ orderId: v.order_id, decision: 'approved' })}
                            className="flex-1 h-10 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/10"
                            disabled={voidMutation.isPending}
                           >
                             Approve
                           </button>
                           <button 
                            onClick={() => voidMutation.mutate({ orderId: v.order_id, decision: 'rejected' })}
                            className="flex-1 h-10 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/10"
                            disabled={voidMutation.isPending}
                           >
                             Reject
                           </button>
                        </div>
                     </div>
                   ))
                 )}
              </div>
           </div>

           {/* ── Expense Form ── */}
           <div className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-rose-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-rose-500/20">
                       <Wallet size={20} />
                    </div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter">Record Expense</h3>
                 </div>
                 <button
                   onClick={() => setShowExpenseForm(!showExpenseForm)}
                   className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                 >
                   <Plus size={18} className={clsx('transition-transform', showExpenseForm && 'rotate-45')} />
                 </button>
              </div>

              {showExpenseForm && (
                <div className="space-y-4 mb-6">
                  <input
                    type="text"
                    placeholder="Recipient (who took the money)"
                    className="w-full h-12 rounded-xl border-2 border-slate-100 bg-slate-50 px-4 text-sm font-bold focus:ring-primary-500 focus:border-primary-500"
                    value={expenseForm.recipient}
                    onChange={(e) => setExpenseForm(p => ({ ...p, recipient: e.target.value }))}
                  />
                  <input
                    type="number"
                    placeholder="Amount (UGX)"
                    className="w-full h-12 rounded-xl border-2 border-slate-100 bg-slate-50 px-4 text-sm font-bold focus:ring-primary-500 focus:border-primary-500"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm(p => ({ ...p, amount: e.target.value }))}
                  />
                  <textarea
                    placeholder="Expense description / reason"
                    className="w-full h-20 rounded-xl border-2 border-slate-100 bg-slate-50 p-4 text-sm font-bold focus:ring-primary-500 focus:border-primary-500"
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm(p => ({ ...p, description: e.target.value }))}
                  />
                  <Button
                    onClick={handleAddExpense}
                    loading={expenseMutation.isPending}
                    className="w-full h-12 rounded-xl font-black text-[11px] uppercase tracking-widest"
                  >
                    <Receipt size={16} className="mr-2" /> Record Expense
                  </Button>
                </div>
              )}

              {/* Expenses list */}
              <div className="space-y-3">
                {(reconciliation?.expenses?.items || []).length === 0 ? (
                  <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest py-6 opacity-30">No expenses recorded today</p>
                ) : (
                  (reconciliation?.expenses?.items || []).map(e => (
                    <div key={e.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-black text-slate-900 truncate">{e.recipient}</p>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest shrink-0">{format(new Date(e.created_at), 'HH:mm')}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-bold truncate mt-0.5">{e.description}</p>
                        <p className="text-[9px] text-slate-400 font-bold mt-0.5">By: {e.cashier_name}</p>
                      </div>
                      <div className="flex items-center gap-3 ml-3">
                        <span className="text-sm font-black text-rose-600 tabular-nums">{formatUGX(e.amount)}</span>
                        <button
                          onClick={() => { if (confirm('Delete this expense?')) deleteExpenseMutation.mutate(e.id); }}
                          className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {(reconciliation?.expenses?.total_value || 0) > 0 && (
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Expenses</span>
                  <span className="text-sm font-black text-rose-600">{formatUGX(reconciliation?.expenses?.total_value || 0)}</span>
                </div>
              )}
           </div>

           <div className="bg-slate-900 rounded-[40px] p-8 text-white">
              <h3 className="text-sm font-black uppercase tracking-tighter mb-6">Financial Summary</h3>
              <div className="space-y-6">
                 <div className="flex justify-between items-end border-b border-white/10 pb-4">
                    <div>
                       <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Gross Revenue</p>
                       <p className="text-lg font-black">{formatUGX(reconciliation?.total_revenue || 0)}</p>
                    </div>
                 </div>
                 <div className="flex justify-between items-end border-b border-white/10 pb-4">
                    <div>
                       <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Total Voids (Value)</p>
                       <p className="text-lg font-black text-rose-500">{formatUGX(reconciliation?.voids?.total_value || 0)}</p>
                    </div>
                 </div>
                 <div className="flex justify-between items-end border-b border-white/10 pb-4">
                    <div>
                       <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Expenses Taken Out</p>
                       <p className="text-lg font-black text-rose-400">- {formatUGX(reconciliation?.expenses?.total_value || 0)}</p>
                    </div>
                 </div>
                 <div className="flex justify-between items-end pt-2">
                    <div>
                       <p className="text-[10px] font-black text-primary-500 uppercase tracking-widest mb-1">Net Cash in Drawer</p>
                       <p className="text-2xl font-black">{formatUGX(reconciliation?.cash_expected_in_drawer || 0)}</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default CashReconciliationPage;
