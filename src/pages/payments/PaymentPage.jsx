import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Receipt, 
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Plus,
  Trash2,
  HelpCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getBill } from '../../api/billing.api';
import { processPayment } from '../../api/payments.api';
import { formatUGX } from '../../utils/currency';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import { clsx } from 'clsx';

// ── CUSTOM PREMIUM INLINE SVG ICONS ──────────────────────────────────────────

const CashIcon = () => (
  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="6" fill="#10B981" />
    <path d="M17 9H7C5.89543 9 5 9.89543 5 11V15C5 16.1046 5.89543 17 7 17H17C18.1046 17 19 16.1046 19 15V11C19 9.89543 18.1046 9 17 9Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
    <circle cx="12" cy="13" r="2" stroke="white" strokeWidth="1.5" />
    <path d="M7 11.5V11.51M17 14.5V14.51" stroke="white" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const AirtelIcon = () => (
  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="6" fill="#EF4444" />
    <path d="M12 5C8.13401 5 5 8.13401 5 12C5 15.866 8.13401 19 12 19C15.866 19 19 15.866 19 12" stroke="white" strokeWidth="2" strokeLinecap="round" />
    <path d="M12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12" stroke="white" strokeWidth="2" strokeLinecap="round" />
    <circle cx="15.5" cy="8.5" r="1.5" fill="white" />
  </svg>
);

const MTNIcon = () => (
  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="6" fill="#FBBF24" />
    <ellipse cx="12" cy="12" rx="8" ry="5" stroke="#0B3C5D" strokeWidth="1.5" />
    <text x="12" y="14" fill="#0B3C5D" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">MTN</text>
  </svg>
);

const EquityIcon = () => (
  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="6" fill="#78350F" />
    <path d="M6 17H18V10H6V17Z" stroke="#FBBF24" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M5 10H19V8L12 4L5 8V10Z" fill="#FBBF24" />
    <path d="M9 13V15M12 13V15M15 13V15" stroke="#78350F" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

const GlovoIcon = () => (
  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="6" fill="#FBBF24" />
    <circle cx="12" cy="11" r="5" fill="#10B981" />
    <path d="M12 16V19M12 19L9.5 17M12 19L14.5 17" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10 11C10 9.89543 10.8954 9 12 9C13.1046 9 14 9.89543 14 11" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

const SplitIcon = () => (
  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="6" fill="#6366F1" />
    <path d="M7 11V15C7 15.5523 7.44772 16 8 16H11" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M17 13V9C17 8.44772 16.5523 8 16 8H13" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M15 14L17 16L19 14" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 10L7 8L5 10" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function PaymentPage() {
  const { bill_id } = useParams();
  const navigate = useNavigate();
  const [method, setMethod] = useState('cash'); // 'cash' | 'airtel_money' | 'mtn_mobile_money' | 'equity' | 'glovo' | 'split'
  
  // Single payment form states
  const [formData, setFormData] = useState({
    amount_paid: '',
    phone_number: '',
    transaction_reference: '',
  });

  // Split payments dynamic form states
  const [splitPayments, setSplitPayments] = useState([
    { payment_method: 'cash', amount_paid: '', phone_number: '', transaction_reference: '' }
  ]);

  const [paymentSuccess, setPaymentSuccess] = useState(null);

  const { data: billResponse, isLoading: billLoading } = useQuery({
    queryKey: ['bills', bill_id],
    queryFn: () => getBill(bill_id),
  });

  const bill = billResponse?.bill;

  const paymentMutation = useMutation({
    mutationFn: (data) => processPayment(data),
    onSuccess: (data) => {
      setPaymentSuccess(data);
      toast.success('Payment processed successfully!');
    },
    onError: (err) => {
      toast.error(err.message || 'Payment failed');
    }
  });

  const handleAddSplitMethod = () => {
    setSplitPayments([
      ...splitPayments,
      { payment_method: 'cash', amount_paid: '', phone_number: '', transaction_reference: '' }
    ]);
  };

  const handleRemoveSplitMethod = (index) => {
    setSplitPayments(splitPayments.filter((_, i) => i !== index));
  };

  const handleUpdateSplitPayment = (index, field, value) => {
    const updated = [...splitPayments];
    updated[index][field] = value;
    setSplitPayments(updated);
  };

  const handleSubmit = () => {
    if (method === 'split') {
      const payload = {
        bill_id,
        payment_method: 'split',
        split_payments: splitPayments.map(p => ({
          payment_method: p.payment_method,
          amount_paid: Number(p.amount_paid),
          mobile_number: p.phone_number || null,
          transaction_reference: p.transaction_reference || null
        }))
      };
      paymentMutation.mutate(payload);
    } else {
      const payload = {
        bill_id,
        payment_method: method,
        amount_paid: Number(formData.amount_paid) || bill.total_amount,
        mobile_number: formData.phone_number || null,
        transaction_reference: formData.transaction_reference || null,
      };
      paymentMutation.mutate(payload);
    }
  };

  if (billLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!bill) return <div className="text-center py-20">Bill not found.</div>;

  // Amount validations
  const totalDue = bill.total_amount;

  const totalSplitPaid = splitPayments.reduce((sum, p) => sum + (Number(p.amount_paid) || 0), 0);
  const remainingSplitAmount = Math.max(0, totalDue - totalSplitPaid);
  const splitChangeToGive = Math.max(0, totalSplitPaid - totalDue);

  const changeToGive = method === 'split' 
    ? splitChangeToGive 
    : Math.max(0, (Number(formData.amount_paid) || 0) - totalDue);

  const isInsufficient = method === 'cash' 
    ? (formData.amount_paid && Number(formData.amount_paid) < totalDue) 
    : false;

  const isSplitInsufficient = method === 'split' && totalSplitPaid < totalDue;

  // Validation rules for buttons
  let isValid = false;
  if (method === 'cash') {
    isValid = Number(formData.amount_paid) >= totalDue;
  } else if (method === 'split') {
    isValid = totalSplitPaid >= totalDue && splitPayments.every(p => Number(p.amount_paid) > 0);
  } else {
    isValid = true; // Digital payments are manually verified by waiter/cashier
  }

  const handleSelectMethod = (newMethod) => {
    setMethod(newMethod);
    // Reset validations
    setFormData({ amount_paid: '', phone_number: '', transaction_reference: '' });
  };

  if (paymentSuccess) {
    const activeReceipt = paymentSuccess.receipt || {};
    const successPayments = activeReceipt.split_payments || [];

    return (
      <div className="max-w-md mx-auto py-12 space-y-8 animate-in zoom-in-95 duration-500">
        <div className="bg-white rounded-[40px] border border-slate-200 shadow-2xl overflow-hidden">
          <div className="bg-emerald-500 h-48 flex items-center justify-center">
            <div className="h-24 w-24 rounded-full bg-white flex items-center justify-center text-emerald-500 shadow-xl">
              <CheckCircle2 size={56} />
            </div>
          </div>
          <div className="p-10 text-center space-y-6">
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Payment Successful!</h2>
              <p className="text-slate-500 font-medium mt-2">Transaction confirmed and order closed.</p>
            </div>
            
            <div className="bg-slate-50 rounded-2xl p-6 space-y-3">
               <div className="flex justify-between text-sm">
                  <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Method</span>
                  <span className="font-black text-slate-900 uppercase">{method.replace('_', ' ')}</span>
               </div>
               <div className="flex justify-between text-sm">
                  <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Total Due</span>
                  <span className="font-black text-slate-900">{formatUGX(totalDue)}</span>
               </div>

               {method === 'split' ? (
                 <div className="pt-3 border-t border-slate-200 space-y-2 text-left">
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Split Details</p>
                   {successPayments.map((p, idx) => (
                     <div key={idx} className="flex justify-between text-xs">
                       <span className="font-medium text-slate-600 uppercase">{p.payment_method.replace('_', ' ')}</span>
                       <span className="font-black text-slate-900">{formatUGX(p.amount_paid)}</span>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="flex justify-between text-sm">
                    <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Amount Settled</span>
                    <span className="font-black text-slate-900">{formatUGX(Number(formData.amount_paid) || totalDue)}</span>
                 </div>
               )}

               {changeToGive > 0 && (
                 <div className="flex justify-between text-sm pt-3 border-t border-slate-200">
                    <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Change Given</span>
                    <span className="font-black text-emerald-600">{formatUGX(changeToGive)}</span>
                 </div>
               )}
            </div>

            <div className="grid grid-cols-1 gap-3">
              <Button onClick={() => window.print()} variant="outline" className="h-12 rounded-xl">
                <Receipt size={18} className="mr-2" />
                Print Receipt
              </Button>
              <Button onClick={() => navigate('/orders/new')} className="h-12 rounded-xl">
                New Order
                <ArrowRight size={18} className="ml-2" />
              </Button>
              <Button onClick={() => navigate('/orders')} variant="ghost" className="h-12 rounded-xl">
                Back to Orders
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const METHOD_DETAILS = {
    cash: { title: 'Cash Settlement', helper: 'Settle the exact bills or enter customer change details.' },
    airtel_money: { title: 'Airtel Money Transfer', helper: 'Collect transaction or verify reference manually.' },
    mtn_mobile_money: { title: 'MTN Mobile Money Transfer', helper: 'Collect transaction or verify reference manually.' },
    equity: { title: 'Equity Bank Transfer', helper: 'Process via cards or instant mobile banking transfers.' },
    glovo: { title: 'Glovo Delivery Settlement', helper: 'Ensure proper delivery courier payments match exact invoice.' },
    split: { title: 'Split Payments channels', helper: 'Distribute amounts across distinct payment channels in real-time.' }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Link to={`/billing/${bill.order_id}`} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft size={20} className="text-slate-500" />
        </Link>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight text-center flex-1 pr-10">Process Settlement</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Payment Methods */}
        <div className="lg:col-span-2 space-y-6">
          <section className="space-y-4">
             <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Select Settlement Method</h3>
             
             {/* 6 Grid items featuring brand specific SVGs */}
             <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <MethodCard 
                  active={method === 'cash'} 
                  icon={CashIcon} 
                  label="Cash" 
                  onClick={() => handleSelectMethod('cash')} 
                />
                <MethodCard 
                  active={method === 'airtel_money'} 
                  icon={AirtelIcon} 
                  label="Airtel Money" 
                  onClick={() => handleSelectMethod('airtel_money')} 
                />
                <MethodCard 
                  active={method === 'mtn_mobile_money'} 
                  icon={MTNIcon} 
                  label="MTN MoMo" 
                  onClick={() => handleSelectMethod('mtn_mobile_money')} 
                />
                <MethodCard 
                  active={method === 'equity'} 
                  icon={EquityIcon} 
                  label="Equity Bank" 
                  onClick={() => handleSelectMethod('equity')} 
                />
                <MethodCard 
                  active={method === 'glovo'} 
                  icon={GlovoIcon} 
                  label="Glovo Pay" 
                  onClick={() => handleSelectMethod('glovo')} 
                />
                <MethodCard 
                  active={method === 'split'} 
                  icon={SplitIcon} 
                  label="Split Bill" 
                  onClick={() => handleSelectMethod('split')} 
                />
             </div>
          </section>

          {/* Settlement Forms */}
          <section className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm">
             <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">{METHOD_DETAILS[method].title}</h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">{METHOD_DETAILS[method].helper}</p>
                </div>
                <Badge variant={method === 'split' ? 'violet' : method === 'cash' ? 'emerald' : 'blue'}>
                  {method.replace('_', ' ')}
                </Badge>
             </div>

             {/* Cash payment form */}
             {method === 'cash' && (
               <div className="space-y-6">
                  <Input 
                    label="Amount Received from Customer" 
                    type="number"
                    placeholder="Enter amount (e.g. 50000)"
                    value={formData.amount_paid}
                    onChange={(e) => setFormData({ ...formData, amount_paid: e.target.value })}
                  />
                  {isInsufficient && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl border border-red-100 animate-pulse">
                      <AlertCircle size={16} />
                      <p className="text-xs font-bold">Amount is less than the bill total!</p>
                    </div>
                  )}
                  <div className="p-6 bg-slate-50 rounded-2xl flex flex-col items-center justify-center text-center space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Change Due</p>
                    <p className={clsx(
                      "text-4xl font-black tabular-nums transition-all",
                      changeToGive > 0 ? "text-emerald-600" : "text-slate-300"
                    )}>
                      {formatUGX(changeToGive)}
                    </p>
                  </div>
               </div>
             )}

             {/* Split Payments Form */}
             {method === 'split' && (
               <div className="space-y-6 animate-in fade-in slide-in-from-top-4">
                  <div className="space-y-4">
                     {splitPayments.map((p, idx) => (
                       <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 relative group animate-in slide-in-from-bottom-2 duration-300">
                         {splitPayments.length > 1 && (
                           <button 
                             type="button"
                             onClick={() => handleRemoveSplitMethod(idx)}
                             className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 transition-colors p-1"
                           >
                             <Trash2 size={16} />
                           </button>
                         )}
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           {/* Method Selector */}
                           <div className="space-y-1">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Method</label>
                             <select
                               className="w-full h-11 border-slate-200 focus:ring-primary-500 rounded-xl text-xs font-black uppercase tracking-widest text-slate-700 bg-white"
                               value={p.payment_method}
                               onChange={(e) => handleUpdateSplitPayment(idx, 'payment_method', e.target.value)}
                             >
                               <option value="cash">Cash</option>
                               <option value="airtel_money">Airtel Money</option>
                               <option value="mtn_mobile_money">MTN MoMo</option>
                               <option value="equity">Equity Bank</option>
                               <option value="glovo">Glovo Pay</option>
                             </select>
                           </div>

                           {/* Amount Input */}
                           <div className="space-y-1">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount (UGX)</label>
                             <input
                               type="number"
                               className="w-full h-11 border-slate-200 focus:ring-primary-500 rounded-xl text-sm font-black text-slate-800"
                               placeholder="e.g. 10000"
                               value={p.amount_paid}
                               onChange={(e) => handleUpdateSplitPayment(idx, 'amount_paid', e.target.value)}
                             />
                           </div>
                         </div>

                         {/* Transaction Detail inputs (Conditional) */}
                         {p.payment_method !== 'cash' && (
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 animate-in fade-in duration-300">
                             <input
                               type="text"
                               placeholder="Phone: 07XXXXXXXX"
                               className="w-full h-10 border-slate-100 rounded-lg text-xs font-medium"
                               value={p.phone_number}
                               onChange={(e) => handleUpdateSplitPayment(idx, 'phone_number', e.target.value)}
                             />
                             <input
                               type="text"
                               placeholder="Transaction Ref (Optional)"
                               className="w-full h-10 border-slate-100 rounded-lg text-xs font-medium"
                               value={p.transaction_reference}
                               onChange={(e) => handleUpdateSplitPayment(idx, 'transaction_reference', e.target.value)}
                             />
                           </div>
                         )}
                       </div>
                     ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleAddSplitMethod}
                    className="w-full h-12 border-2 border-dashed border-slate-200 hover:border-primary-500 text-slate-400 hover:text-primary-500 rounded-xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest transition-all"
                  >
                    <Plus size={16} /> Add Split settlement channel
                  </button>

                  {/* Realtime progress tracker */}
                  <div className="p-6 bg-slate-900 rounded-2xl text-white space-y-4">
                     <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-400 uppercase tracking-wider">Split Total Settled</span>
                        <span className="font-black text-emerald-400 text-lg tabular-nums">{formatUGX(totalSplitPaid)}</span>
                     </div>
                     
                     {remainingSplitAmount > 0 ? (
                       <div className="flex justify-between items-center text-xs pt-3 border-t border-white/10 animate-pulse">
                          <span className="font-bold text-slate-400 uppercase tracking-wider">Remaining Balance</span>
                          <span className="font-black text-rose-400 text-lg tabular-nums">{formatUGX(remainingSplitAmount)}</span>
                       </div>
                     ) : (
                       <div className="flex justify-between items-center text-xs pt-3 border-t border-white/10">
                          <span className="font-bold text-emerald-500 uppercase tracking-wider">Change Due</span>
                          <span className="font-black text-emerald-400 text-lg tabular-nums">{formatUGX(splitChangeToGive)}</span>
                       </div>
                     )}
                     
                     {/* Progress bar */}
                     <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                       <div 
                         className={clsx(
                           "h-full rounded-full transition-all duration-500",
                           totalSplitPaid >= totalDue ? "bg-emerald-500" : "bg-primary-500"
                         )}
                         style={{ width: `${Math.min(100, (totalSplitPaid / totalDue) * 100)}%` }}
                       />
                     </div>
                  </div>
               </div>
             )}

             {/* Digital Single Transfer forms (MTN MoMo, Airtel Money, Equity, Glovo) */}
             {method !== 'cash' && method !== 'split' && (
               <div className="space-y-6 animate-in fade-in slide-in-from-top-4">
                  <div className="grid grid-cols-1 gap-6">
                    {/* Add Reference field for instant auditing */}
                    <Input 
                      label="Transaction Reference ID (Optional)" 
                      placeholder="e.g. TXN98765432"
                      value={formData.transaction_reference}
                      onChange={(e) => setFormData({ ...formData, transaction_reference: e.target.value })}
                    />
                    
                    {(method === 'airtel_money' || method === 'mtn_mobile_money') && (
                      <Input 
                        label="Customer Mobile Number (Optional)" 
                        placeholder="07XXXXXXXX"
                        value={formData.phone_number}
                        onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                      />
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                    <ShieldCheck size={12} className="text-emerald-500" /> Verify settlement on mobile phone/banking portal before completing checkout.
                  </p>
               </div>
             )}
          </section>
        </div>

        {/* Bill Summary Sidebar */}
        <div className="space-y-6">
           <div className="bg-slate-900 text-white rounded-[32px] p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
              
              <div className="flex items-center gap-3 mb-6 relative z-10">
                <Receipt className="text-primary-500" size={20} />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Settlement Invoice</h3>
              </div>
              
              <div className="space-y-4 mb-8 relative z-10">
                 <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Bill Number</span>
                    <span className="font-bold">#BILL-{bill.bill_number.slice(-6).toUpperCase()}</span>
                 </div>
                 <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Order ID</span>
                    <span className="font-bold">#ORD-{bill.order_id?.slice(-6).toUpperCase()}</span>
                 </div>
                 <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                    <span className="text-xs font-black uppercase tracking-widest text-primary-500">Grand Total Due</span>
                    <span className="text-3xl font-black text-white tabular-nums">{formatUGX(totalDue)}</span>
                 </div>
              </div>

              <Button 
                onClick={handleSubmit}
                loading={paymentMutation.isPending}
                disabled={!isValid}
                className="w-full h-14 bg-primary-500 text-slate-900 hover:bg-primary-400 rounded-2xl text-lg font-black shadow-lg shadow-primary-500/20"
              >
                <CheckCircle2 size={24} className="mr-3 animate-bounce" />
                COMPLETE PAYMENT
              </Button>
           </div>

           <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-start gap-4">
             <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
               <ShieldCheck className="text-slate-400" size={20} />
             </div>
             <div>
               <h4 className="text-sm font-bold text-slate-900">Secure Settlement</h4>
               <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                 All payments are verified against the billing records and logged for end-of-day reconciliation.
               </p>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function MethodCard({ active, icon: Icon, label, onClick }) {
  return (
    <div 
      onClick={onClick}
      className={clsx(
        "p-6 rounded-3xl border-2 transition-all cursor-pointer flex flex-col items-center text-center gap-3 select-none active:scale-95 duration-100",
        active 
          ? "border-primary-500 bg-primary-50 shadow-lg shadow-primary-500/10 scale-105" 
          : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm"
      )}
    >
      <div className="shrink-0 transition-transform duration-300 group-hover:scale-110">
        <Icon />
      </div>
      <span className={clsx(
        "text-[10px] font-black uppercase tracking-widest whitespace-nowrap",
        active ? "text-primary-700" : "text-slate-400"
      )}>
        {label}
      </span>
    </div>
  );
}
