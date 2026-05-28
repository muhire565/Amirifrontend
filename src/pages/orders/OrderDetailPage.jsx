import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Clock, 
  User, 
  MapPin, 
  Receipt, 
  Printer, 
  XCircle,
  PlusCircle,
  CheckCircle,
  ShieldAlert,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getOrderById, markOrderServed, requestVoid } from '../../api/orders.api';
import { useAuthStore } from '../../store/auth.store';
import { formatUGX } from '../../utils/currency';
import { formatDateTime } from '../../utils/format';
import { ORDER_STATUSES } from '../../utils/orderStatus';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import OrderStatusBadge from '../../components/orders/OrderStatusBadge';
import OrderTimeline from '../../components/orders/OrderTimeline';
import Modal from '../../components/ui/Modal';
import PageHeader from '../../components/ui/PageHeader';
import { useState } from 'react';
import clsx from 'clsx';

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, hasRole } = useAuthStore();
  const [voidModal, setVoidModal] = useState({ isOpen: false, reason: '' });

  const { data: response, isLoading, error } = useQuery({
    queryKey: ['orders', id],
    queryFn: () => getOrderById(id),
  });

  const order = response?.order;

  const servedMutation = useMutation({
    mutationFn: () => markOrderServed(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['orders', id]);
      toast.success('Order marked as served');
    }
  });

  const voidMutation = useMutation({
    mutationFn: (reason) => requestVoid(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries(['orders', id]);
      toast.success('Void request submitted');
      setVoidModal({ isOpen: false, reason: '' });
    }
  });

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (error) return <div className="text-center py-20 text-red-500 font-bold">Error: {error.message}</div>;
  if (!order) return <div className="text-center py-20 font-bold text-slate-400 uppercase tracking-widest">Order not found</div>;

  const canGenerateBill = hasRole('cashier') && [ORDER_STATUSES.READY, ORDER_STATUSES.SERVED].includes(order.status);
  const canMarkServed = hasRole('cashier') && order.status === ORDER_STATUSES.READY;
  const canAddItems = hasRole('cashier') && ![ORDER_STATUSES.PAID, ORDER_STATUSES.VOIDED, ORDER_STATUSES.CANCELLED, ORDER_STATUSES.BILLED].includes(order.status);
  const canRequestVoid = hasRole('cashier') && ![ORDER_STATUSES.PAID, ORDER_STATUSES.VOIDED, ORDER_STATUSES.CANCELLED].includes(order.status);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/orders')}
          className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Orders
        </button>
      </div>

      <PageHeader 
        title={`Order #ORD-${order.order_number.slice(-6).toUpperCase()}`}
        subtitle={`Created on ${formatDateTime(order.created_at)}`}
        rightSlot={
          <>
            {canGenerateBill && (
              <Button onClick={() => navigate(`/billing/${order.id}`)} variant="primary" icon={Receipt}>
                Generate Bill
              </Button>
            )}
            {canMarkServed && (
              <Button onClick={() => servedMutation.mutate()} loading={servedMutation.isPending} variant="primary" icon={CheckCircle}>
                Mark Served
              </Button>
            )}
            {canAddItems && (
              <Button variant="secondary" onClick={() => navigate(`/orders/new?reorder=${order.id}`)} icon={PlusCircle}>
                Add Items
              </Button>
            )}
            {canRequestVoid && (
              <Button variant="danger" onClick={() => setVoidModal({ ...voidModal, isOpen: true })} icon={XCircle}>
                Void Order
              </Button>
            )}
          </>
        }
      />

      {/* Hero Info Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden">
        <div className="p-8 flex flex-col md:flex-row items-start justify-between gap-8">
           <div className="flex-1 space-y-6">
              <div className="flex items-center gap-4">
                 <div className="h-14 w-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                    <UtensilsCrossed size={28} />
                 </div>
                 <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
                    <OrderStatusBadge status={order.status} />
                 </div>
              </div>

              <div className="flex flex-wrap gap-4">
                 <InfoPill icon={MapPin} label="Table" value={`T-${order.table_number}`} />
                 <InfoPill icon={User} label="Waiter" value={order.waiter_name} />
                 <InfoPill icon={Clock} label="Branch" value="Main Branch" />
              </div>
           </div>

           <div className="w-full md:w-auto h-full flex flex-col justify-end text-right">
              <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Amount</p>
              <h2 className="text-4xl font-bold text-slate-900 tracking-tight">{formatUGX(order.total_amount)}</h2>
           </div>
        </div>
        
        {/* Timeline */}
        <div className="px-8 pb-10 pt-6 border-t border-slate-50 bg-slate-50/30">
           <OrderTimeline currentStatus={order.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Items Table */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-slate-100 rounded-3xl shadow-card overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
               <h3 className="text-base font-bold text-slate-900 tracking-tight">Order Items</h3>
               <Badge variant="slate">{order.items?.length || 0} Items</Badge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 h-11">
                    <th className="px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Item Details</th>
                    <th className="px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Qty</th>
                    <th className="px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {order.items?.map((item) => (
                    <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors h-16">
                      <td className="px-6 py-4">
                        <p className="text-[14px] font-bold text-slate-900 leading-tight">{item.menu_item_name}</p>
                        {item.special_instructions && (
                          <p className="text-[11px] font-medium text-brand-primary mt-1 italic">Note: {item.special_instructions}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[13px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">x{item.quantity}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-[14px] font-bold text-slate-900">{formatUGX(item.subtotal)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {order.notes && (
            <div className="p-6 bg-brand-primary-light/40 border border-brand-primary/10 rounded-2xl flex gap-4">
               <AlertCircle className="text-brand-primary shrink-0" size={20} />
               <div>
                  <p className="text-[11px] font-bold text-brand-primary-dark uppercase tracking-widest mb-1">Kitchen Note</p>
                  <p className="text-[13px] font-medium text-slate-700 leading-relaxed">{order.notes}</p>
               </div>
            </div>
          )}
        </div>

        {/* Payment Summary Panel */}
        <div className="lg:col-span-4 space-y-6">
           <div className="bg-brand-sidebar rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden">
              {/* Decorative Glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 rounded-full blur-3xl -mr-10 -mt-10" />
              
              <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-8">Financial Summary</h3>
              
              <div className="space-y-5 relative z-10">
                 <div className="flex justify-between items-end">
                    <div className="flex flex-col">
                       <span className="text-[10px] font-bold text-brand-primary uppercase tracking-widest mb-1">Total Payable</span>
                       <span className="text-3xl font-bold text-white tracking-tight">{formatUGX(order.total_amount)}</span>
                    </div>
                 </div>
              </div>

              {order.status === ORDER_STATUSES.PAID && (
                <div className="mt-10 p-5 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-4 animate-in slide-in-from-bottom-2 duration-500">
                   <div className="h-10 w-10 bg-brand-primary rounded-full flex items-center justify-center text-slate-900 shrink-0">
                      <CheckCircle size={20} />
                   </div>
                   <div className="min-w-0">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Transaction Settled</p>
                      <p className="text-[13px] font-bold text-white truncate">Ref: {order.payment_reference || 'N/A'}</p>
                   </div>
                </div>
              )}
           </div>

           {/* Quick Actions Card */}
           <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-card">
              <h3 className="text-[12px] font-bold text-slate-900 uppercase tracking-widest mb-6 px-2">Actions</h3>
              <div className="space-y-2">
                 <button className="flex items-center justify-between w-full p-4 rounded-2xl hover:bg-slate-50 transition-all group">
                    <div className="flex items-center gap-3">
                       <Printer size={18} className="text-slate-400 group-hover:text-slate-600" />
                       <span className="text-[14px] font-bold text-slate-700">Print Receipt</span>
                    </div>
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-900" />
                 </button>
                 {canAddItems && (
                   <button 
                     onClick={() => navigate(`/orders/new?reorder=${order.id}`)}
                     className="flex items-center justify-between w-full p-4 rounded-2xl hover:bg-brand-primary-light/30 transition-all group"
                   >
                      <div className="flex items-center gap-3">
                         <PlusCircle size={18} className="text-brand-primary" />
                         <span className="text-[14px] font-bold text-slate-700">Add More Items</span>
                      </div>
                      <ChevronRight size={16} className="text-brand-primary" />
                   </button>
                 )}
              </div>
           </div>
        </div>
      </div>

      {/* Void Modal */}
      <Modal
        isOpen={voidModal.isOpen}
        onClose={() => setVoidModal({ ...voidModal, isOpen: false })}
        title="Request Order Void"
        footer={
          <>
            <Button variant="secondary" onClick={() => setVoidModal({ ...voidModal, isOpen: false })}>Cancel</Button>
            <Button 
              variant="danger" 
              loading={voidMutation.isPending} 
              disabled={!voidModal.reason}
              onClick={() => voidMutation.mutate(voidModal.reason)}
            >
              Submit Void Request
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-start gap-4">
            <ShieldAlert className="text-red-600 shrink-0 mt-0.5" size={20} />
            <div>
               <p className="text-[13px] text-red-800 font-bold mb-1">Administrative Action Required</p>
               <p className="text-[12px] text-red-600 font-medium leading-relaxed">
                 Voiding an order removes it from active accounts. This requires a valid reason and manager approval.
               </p>
            </div>
          </div>
          <textarea
            className="w-full rounded-2xl border-slate-200 text-[14px] font-medium p-4 focus:ring-red-500 focus:border-red-400 min-h-[140px] bg-slate-50/50"
            placeholder="Why is this order being voided?"
            value={voidModal.reason}
            onChange={(e) => setVoidModal({ ...voidModal, reason: e.target.value })}
          />
        </div>
      </Modal>
    </div>
  );
}

function InfoPill({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-2 bg-white border border-slate-100 rounded-xl shadow-sm">
      <Icon size={14} className="text-slate-400" />
      <div className="flex flex-col">
         <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</span>
         <span className="text-xs font-bold text-slate-700 leading-none">{value}</span>
      </div>
    </div>
  );
}

function UtensilsCrossed(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m16 2-2.3 2.3c-.7.7-.7 1.8 0 2.5l1.2 1.2c.7.7 1.8.7 2.5 0L22 4" />
      <path d="m21 3-3.3 3.3c-.7.7-1.8.7-2.5 0l-1.2-1.2c-.7-.7-.7-1.8 0-2.5L17 2" />
      <path d="m15 5 2 2" />
      <path d="m19 1 2 2" />
      <path d="M22 19a2 2 0 1 1-4 0V9a2 2 0 0 1 2-2c1.1 0 2 .9 2 2v10Z" />
      <path d="M15 21a2 2 0 1 0 4 0V11a2 2 0 0 0-2-2c-1.1 0-2 .9-2 2v10Z" />
      <path d="M3 20a5 5 0 0 1 5-5h1a5 5 0 0 1 5 5v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-1Z" />
      <path d="M7 15V4a1 1 0 0 1 1-1h0a1 1 0 0 1 1 1v11" />
      <path d="M5 10c0-2 2-2 2-2s2 0 2 2" />
    </svg>
  );
}
