import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  User, 
  Phone, 
  MapPin, 
  Truck, 
  Bike, 
  CheckCircle2, 
  AlertCircle,
  Package,
  Calendar,
  XCircle
} from 'lucide-react';
import { 
  getDeliveryById, 
  assignRider, 
  markPickedUp, 
  markDelivered, 
  markFailed,
  getRiders
} from '../../api/delivery.api';
import { useAuthStore } from '../../store/auth.store';
import DeliveryStatusBadge from '../../components/delivery/DeliveryStatusBadge';
import DeliveryTimeline from '../../components/delivery/DeliveryTimeline';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { formatUGX } from '../../utils/currency';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const DeliveryDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, hasRole } = useAuthStore();
  const [isRiderModalOpen, setIsRiderModalOpen] = useState(false);
  const [isFailedModalOpen, setIsFailedModalOpen] = useState(false);
  const [failedReason, setFailedReason] = useState('');

  const [riderData, setRiderData] = useState({
    rider_name: '',
    rider_phone: ''
  });

  const { data: delivery, isLoading } = useQuery({
    queryKey: ['delivery', id],
    queryFn: () => getDeliveryById(id),
  });

  const { data: recentRiders } = useQuery({
    queryKey: ['riders-recent'],
    queryFn: () => getRiders({ limit: 5 }),
  });

  const assignRiderMutation = useMutation({
    mutationFn: (data) => assignRider(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['delivery', id]);
      setIsRiderModalOpen(false);
      toast.success('Rider assigned successfully');
    },
    onError: (err) => toast.error(err.message || 'Failed to assign rider')
  });

  const statusMutation = useMutation({
    mutationFn: (action) => {
      if (action === 'picked_up') return markPickedUp(id);
      if (action === 'delivered') return markDelivered(id);
      return Promise.reject('Invalid action');
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['delivery', id]);
      toast.success('Delivery status updated');
    },
    onError: (err) => toast.error(err.message || 'Failed to update status')
  });

  const failMutation = useMutation({
    mutationFn: () => markFailed(id, failedReason),
    onSuccess: () => {
      queryClient.invalidateQueries(['delivery', id]);
      setIsFailedModalOpen(false);
      toast.success('Delivery marked as failed');
    },
    onError: (err) => toast.error(err.message || 'Failed to report failure')
  });

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!delivery) return <div className="text-center py-20 text-slate-400 font-bold">Delivery not found</div>;

  const isPhoneValid = /^(07\d{8}|2567\d{8})$/.test(riderData.rider_phone);

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/delivery')}
            className="h-12 w-12 flex items-center justify-center bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 transition-all shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-black text-slate-900 tracking-tighter">Order #{delivery.order_number}</h1>
              <DeliveryStatusBadge status={delivery.status} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Calendar size={12} /> {format(new Date(delivery.created_at), 'dd MMM yyyy, HH:mm')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {delivery.status === 'ready_for_pickup' && !delivery.rider_id && (
            <Button onClick={() => setIsRiderModalOpen(true)} className="rounded-2xl h-12 px-8">
              <Bike size={18} className="mr-2" />
              Assign Rider
            </Button>
          )}

          {delivery.status === 'ready_for_pickup' && delivery.rider_id && (
            <Button onClick={() => statusMutation.mutate('picked_up')} className="rounded-2xl h-12 px-8" loading={statusMutation.isPending}>
              <Truck size={18} className="mr-2" />
              Mark as Picked Up
            </Button>
          )}

          {delivery.status === 'picked_up' && (
            <Button onClick={() => statusMutation.mutate('delivered')} className="rounded-2xl h-12 px-8" loading={statusMutation.isPending}>
              <CheckCircle2 size={18} className="mr-2" />
              Confirm Delivery
            </Button>
          )}

          {!['delivered', 'failed'].includes(delivery.status) && (
             <button 
              onClick={() => setIsFailedModalOpen(true)}
              className="h-12 px-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-700 transition-colors"
            >
               <XCircle size={16} /> Mark Failed
             </button>
          )}
        </div>
      </div>

      {/* Progress Timeline */}
      <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm">
        <DeliveryTimeline delivery={delivery} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Customer & Items (2/3) */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex items-center gap-4">
              <div className="h-10 w-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary-500">
                 <User size={20} />
              </div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter">Customer Details</h3>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                 <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Customer Name</p>
                   <p className="text-lg font-black text-slate-900">{delivery.customer_name}</p>
                 </div>
                 <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Phone Number</p>
                   <a href={`tel:${delivery.customer_phone}`} className="inline-flex items-center gap-2 text-primary-600 font-black hover:underline">
                      <Phone size={14} /> {delivery.customer_phone}
                   </a>
                 </div>
              </div>
              <div className="space-y-4">
                 <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Delivery Address</p>
                   <div className="flex gap-2">
                     <MapPin size={16} className="text-rose-500 shrink-0 mt-1" />
                     <p className="text-sm font-bold text-slate-700">{delivery.delivery_address}</p>
                   </div>
                 </div>
                 {delivery.delivery_zone && (
                   <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Zone</p>
                     <span className="bg-slate-100 px-3 py-1 rounded-lg text-xs font-black text-slate-600 uppercase tracking-widest">
                       {delivery.delivery_zone}
                     </span>
                   </div>
                 )}
              </div>
            </div>
            {delivery.delivery_notes && (
              <div className="px-8 pb-8">
                 <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-3">
                    <AlertCircle size={18} className="text-amber-500 shrink-0" />
                    <p className="text-xs font-bold text-amber-900">Notes: {delivery.delivery_notes}</p>
                 </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
             <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex items-center gap-4">
              <div className="h-10 w-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary-500">
                 <Package size={20} />
              </div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter">Order Items</h3>
            </div>
            <div className="p-8">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-slate-50">
                    <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Item</th>
                    <th className="pb-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Qty</th>
                    <th className="pb-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {delivery.order_items?.map(item => (
                    <tr key={item.id}>
                      <td className="py-4">
                        <p className="text-xs font-black text-slate-900">{item.name}</p>
                        {item.special_instructions && <p className="text-[10px] font-bold text-slate-400 italic mt-1">{item.special_instructions}</p>}
                      </td>
                      <td className="py-4 text-center text-xs font-black text-slate-900">{item.quantity}</td>
                      <td className="py-4 text-right text-xs font-black text-slate-900">{formatUGX(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-8 pt-8 border-t border-slate-100 space-y-3 max-w-xs ml-auto">
                 <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <span>Subtotal</span>
                    <span>{formatUGX(delivery.subtotal)}</span>
                 </div>
                 <div className="flex justify-between text-[10px] font-black text-primary-500 uppercase tracking-widest">
                    <span>Delivery Fee</span>
                    <span>{formatUGX(delivery.delivery_fee)}</span>
                 </div>
                 <div className="flex justify-between items-center pt-3 border-t-2 border-slate-900">
                    <span className="text-sm font-black uppercase tracking-widest text-slate-900">Total Paid</span>
                    <span className="text-xl font-black text-slate-900">{formatUGX(delivery.total_amount)}</span>
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rider Info (1/3) */}
        <div className="space-y-8">
           <div className={clsx(
             "rounded-[40px] p-8 border shadow-sm transition-all",
             delivery.rider_id ? "bg-white border-slate-100" : "bg-slate-50 border-dashed border-slate-200"
           )}>
              <div className="flex items-center gap-3 mb-8">
                 <div className={clsx(
                   "h-10 w-10 rounded-xl flex items-center justify-center",
                   delivery.rider_id ? "bg-primary-500 text-slate-900 shadow-lg shadow-primary-500/20" : "bg-slate-200 text-slate-400"
                 )}>
                   <Bike size={20} />
                 </div>
                 <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter">Rider Information</h3>
              </div>

              {delivery.rider_id ? (
                <div className="space-y-6">
                   <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Assigned Rider</p>
                     <p className="text-lg font-black text-slate-900">{delivery.rider_name}</p>
                   </div>
                   <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Rider Phone</p>
                     <a href={`tel:${delivery.rider_phone}`} className="inline-flex items-center gap-2 text-primary-600 font-black hover:underline">
                        <Phone size={14} /> {delivery.rider_phone}
                     </a>
                   </div>
                   <div className="pt-6 border-t border-slate-50">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Dispatch History</p>
                      <div className="space-y-3">
                         <div className="flex items-center justify-between text-[10px] font-bold">
                            <span className="text-slate-500">Assigned</span>
                            <span className="text-slate-900">{format(new Date(delivery.rider_assigned_at), 'HH:mm')}</span>
                         </div>
                         {delivery.picked_up_at && (
                           <div className="flex items-center justify-between text-[10px] font-bold">
                              <span className="text-slate-500">Picked Up</span>
                              <span className="text-slate-900">{format(new Date(delivery.picked_up_at), 'HH:mm')}</span>
                           </div>
                         )}
                      </div>
                   </div>
                </div>
              ) : (
                <div className="text-center py-10">
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                     Awaiting rider assignment<br />from the cashier
                   </p>
                </div>
              )}
           </div>

           <div className="bg-slate-900 rounded-[40px] p-8 text-white">
              <div className="flex items-center gap-3 mb-6">
                 <CreditCard size={20} className="text-primary-500" />
                 <h3 className="text-sm font-black uppercase tracking-tighter">Payment</h3>
              </div>
              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Method</span>
                    <span className="text-xs font-black uppercase tracking-widest bg-white/10 px-3 py-1 rounded-lg">
                      {delivery.payment_method.replace('_', ' ')}
                    </span>
                 </div>
                 <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-[10px] font-black text-primary-500 uppercase tracking-widest mb-1">Status</p>
                    <p className="text-sm font-black">
                      {delivery.status === 'delivered' ? '✓ PAYMENT COLLECTED' : 'AWAITING COLLECTION'}
                    </p>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Rider Assignment Modal */}
      <Modal 
        isOpen={isRiderModalOpen} 
        onClose={() => setIsRiderModalOpen(false)}
        title="Assign Delivery Rider"
      >
        <form onSubmit={(e) => { e.preventDefault(); assignRiderMutation.mutate(riderData); }} className="space-y-6">
          <Input 
            label="Rider Name" 
            placeholder="Enter rider's full name" 
            required 
            value={riderData.rider_name}
            onChange={(e) => setRiderData(prev => ({ ...prev, rider_name: e.target.value }))}
          />
          <div className="space-y-1">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rider Phone</label>
             <div className="relative">
                <input 
                  type="text" 
                  className={clsx(
                    "w-full h-12 rounded-xl border-2 px-4 text-sm font-bold transition-all focus:ring-0",
                    riderData.rider_phone ? (isPhoneValid ? "border-emerald-500 bg-emerald-50/10" : "border-rose-500 bg-rose-50/10") : "border-slate-100 bg-slate-50"
                  )}
                  placeholder="07..."
                  value={riderData.rider_phone}
                  onChange={(e) => setRiderData(prev => ({ ...prev, rider_phone: e.target.value }))}
                  required
                />
             </div>
          </div>

          <div className="space-y-3">
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Recent Riders</p>
             <div className="flex flex-wrap gap-2">
                {recentRiders?.riders?.map(r => (
                  <button 
                    key={r.id}
                    type="button"
                    onClick={() => setRiderData({ rider_name: r.full_name, rider_phone: r.phone })}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-[10px] font-black text-slate-600 transition-colors"
                  >
                    {r.full_name}
                  </button>
                ))}
             </div>
          </div>

          <Button type="submit" className="w-full h-12 rounded-xl" loading={assignRiderMutation.isPending} disabled={!isPhoneValid}>
            Confirm Rider
          </Button>
        </form>
      </Modal>

      {/* Failure Modal */}
      <Modal 
        isOpen={isFailedModalOpen} 
        onClose={() => setIsFailedModalOpen(false)}
        title="Mark Delivery as Failed"
      >
        <div className="space-y-6">
           <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 flex gap-3 text-rose-800">
              <AlertCircle size={18} className="shrink-0" />
              <p className="text-xs font-bold leading-relaxed">This will mark the delivery as unsuccessful. Please provide a clear reason for internal auditing.</p>
           </div>
           <textarea 
            placeholder="Reason for failure (e.g. Could not reach customer, Wrong address, Item damaged)"
            className="w-full h-32 rounded-2xl border-2 border-slate-100 bg-slate-50 p-4 text-sm font-bold focus:ring-rose-500 focus:border-rose-500"
            value={failedReason}
            onChange={(e) => setFailedReason(e.target.value)}
           />
           <Button 
            variant="danger" 
            className="w-full h-12 rounded-xl" 
            onClick={() => failMutation.mutate()}
            loading={failMutation.isPending}
            disabled={failedReason.length < 5}
           >
             Confirm Failure
           </Button>
        </div>
      </Modal>
    </div>
  );
};

export default DeliveryDetailPage;
