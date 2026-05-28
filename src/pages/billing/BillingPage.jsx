import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Receipt, 
  Printer, 
  CreditCard, 
  FileText,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getOrderById } from '../../api/orders.api';
import { generateBill, getBillByOrder } from '../../api/billing.api';
import { useAuthStore } from '../../store/auth.store';
import { formatUGX } from '../../utils/currency';
import { formatDateTime } from '../../utils/format';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { clsx } from 'clsx';

export default function BillingPage() {
  const { order_id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const { data: orderResponse, isLoading: orderLoading } = useQuery({
    queryKey: ['orders', order_id],
    queryFn: () => getOrderById(order_id),
  });

  const { data: billResponse, isLoading: billLoading } = useQuery({
    queryKey: ['bills', 'order', order_id],
    queryFn: () => getBillByOrder(order_id),
    retry: false,
  });

  const generateMutation = useMutation({
    mutationFn: () => generateBill(order_id),
    onSuccess: () => {
      queryClient.invalidateQueries(['bills', 'order', order_id]);
      queryClient.invalidateQueries(['orders', order_id]);
      toast.success('Bill generated successfully!');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to generate bill');
    }
  });

  const order = orderResponse?.order;
  const bill = billResponse?.bill;

  if (orderLoading || billLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!order) return <div className="text-center py-20">Order not found.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link 
          to={`/orders/${order_id}`} 
          className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-primary-600 transition-colors"
        >
          <ArrowLeft size={16} className="mr-1" />
          Back to Order
        </Link>
        {bill && (
           <Button variant="outline" onClick={() => window.print()} className="print:hidden">
              <Printer size={18} className="mr-2" />
              Print Receipt
           </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Receipt View */}
        <div className="print:block">
           {bill ? (
             <ReceiptCard bill={bill} order={order} />
           ) : (
             <div className="bg-white rounded-3xl border border-slate-200 border-dashed p-12 text-center space-y-4">
                <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                  <Receipt size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-900">No Bill Generated</h3>
                <p className="text-sm text-slate-500 max-w-xs mx-auto">
                  Click the button to generate the official bill for this order. This will fix the prices and lock the items.
                </p>
                <Button 
                  onClick={() => generateMutation.mutate()} 
                  loading={generateMutation.isPending}
                  className="w-full"
                >
                  Generate Bill Now
                </Button>
             </div>
           )}
        </div>

        {/* Info & Actions */}
        <div className="space-y-6 print:hidden">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Order Summary</h3>
            <div className="space-y-3">
              {(order.order_items || order.items || []).map((item, idx) => (
                <div key={item.id || idx} className="flex justify-between items-start">
                  <div className="text-sm">
                    <p className="font-bold text-slate-900">{item.name || item.menu_item_name}</p>
                    <p className="text-[10px] text-slate-400">Qty: {item.quantity} × {formatUGX(item.price || (item.subtotal / item.quantity))}</p>
                  </div>
                  <span className="text-sm font-black text-slate-900">{formatUGX(item.subtotal || (item.price * item.quantity))}</span>
                </div>
              ))}
            </div>
            
            <div className="pt-6 border-t border-slate-100 space-y-2">
               <div className="flex justify-between text-xl pt-2">
                  <span className="font-black text-slate-900 uppercase">Grand Total</span>
                  <span className="font-black text-primary-600">{formatUGX(order.total_amount)}</span>
               </div>
            </div>
          </div>

          {bill && (
             <div className="bg-primary-500 rounded-3xl p-8 text-slate-900 shadow-xl shadow-primary-500/20">
                <h3 className="text-sm font-black uppercase tracking-widest text-primary-900 mb-2">Next Step</h3>
                <h4 className="text-2xl font-black mb-4">Process Payment</h4>
                <p className="text-sm font-medium text-primary-900 mb-6 leading-relaxed">
                  The bill is ready. Please proceed to select a payment method and complete the transaction.
                </p>
                <Button 
                  onClick={() => navigate(`/payments/new/${bill.id}`)}
                  className="w-full bg-slate-900 text-white hover:bg-slate-800 h-14 rounded-2xl text-lg font-black"
                >
                  <CreditCard size={20} className="mr-3" />
                  PROCEED TO PAY
                </Button>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReceiptCard({ bill, order }) {
  const items = order.order_items || order.items || [];
  const tableNumber = order.tables?.table_number || order.table_number || '-';
  const waiterName = order.waiter?.full_name || order.waiter_name || '-';
  const orderDate = bill.created_at || order.created_at;

  return (
    <div className="receipt-card bg-white py-6 px-5 shadow-lg border border-slate-100 w-full max-w-[302px] mx-auto font-mono text-slate-900 text-[12px] leading-relaxed">
      
      {/* ═══ Header ═══ */}
      <div className="text-center mb-4">
        <h2 className="text-[16px] font-black uppercase tracking-tight leading-tight">AMIRI FOODS</h2>
        <h3 className="text-[13px] font-bold uppercase tracking-tight">RESTAURANT</h3>
        <div className="mt-2 text-[11px] leading-snug space-y-0.5">
          <p className="font-bold">Branch: MAKERERE KIKONI</p>
          <p className="font-medium">Contact: +256 759 417831</p>
        </div>
      </div>

      {/* ═══ Separator ═══ */}
      <div className="border-t-2 border-dashed border-slate-900 my-3" />

      {/* ═══ Bill Info ═══ */}
      <div className="space-y-1 text-[11px]">
        <div className="flex justify-between">
          <span className="font-bold">Bill #:</span>
          <span className="font-bold">{bill.bill_number || '-'}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">Date:</span>
          <span>{orderDate ? formatDateTime(orderDate) : '-'}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">Order #:</span>
          <span>{order.order_number || '-'}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">Waiter:</span>
          <span>{waiterName}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">Table:</span>
          <span>{tableNumber}</span>
        </div>
      </div>

      {/* ═══ Separator ═══ */}
      <div className="border-t-2 border-dashed border-slate-900 my-3" />

      {/* ═══ Column Headers ═══ */}
      <div className="flex text-[10px] font-black uppercase border-b border-slate-300 pb-1 mb-2">
        <span className="flex-1">Item</span>
        <span className="w-8 text-center">Qty</span>
        <span className="w-20 text-right">Price</span>
        <span className="w-20 text-right">Total</span>
      </div>

      {/* ═══ Items ═══ */}
      <div className="space-y-1.5 mb-3">
        {items.map((item, idx) => {
          const itemName = item.name || item.menu_item_name || 'Item';
          const qty = item.quantity || 1;
          const unitPrice = item.price || (item.subtotal / qty);
          const total = item.subtotal || (item.price * qty);
          return (
            <div key={item.id || idx} className="flex text-[11px] leading-tight">
              <span className="flex-1 font-bold truncate pr-1">{itemName}</span>
              <span className="w-8 text-center">{qty}</span>
              <span className="w-20 text-right tabular-nums">{Number(unitPrice).toLocaleString()}</span>
              <span className="w-20 text-right tabular-nums font-bold">{Number(total).toLocaleString()}</span>
            </div>
          );
        })}
      </div>

      {/* ═══ Separator ═══ */}
      <div className="border-t-2 border-dashed border-slate-900 my-3" />

      {/* ═══ Totals ═══ */}
      <div className="space-y-1 text-[11px]">
        {order.subtotal && order.subtotal !== order.total_amount && (
          <div className="flex justify-between">
            <span className="font-bold">Subtotal:</span>
            <span className="tabular-nums">{formatUGX(order.subtotal)}</span>
          </div>
        )}
        {order.tax_amount > 0 && (
          <div className="flex justify-between">
            <span className="font-bold">Tax ({order.tax_rate || 0}%):</span>
            <span className="tabular-nums">{formatUGX(order.tax_amount)}</span>
          </div>
        )}
      </div>

      {/* ═══ Grand Total ═══ */}
      <div className="border-t-2 border-double border-slate-900 mt-2 pt-2">
        <div className="flex justify-between text-[14px]">
          <span className="font-black uppercase">GRAND TOTAL</span>
          <span className="font-black tabular-nums">{formatUGX(bill.total_amount)}</span>
        </div>
      </div>

      {/* ═══ Footer ═══ */}
      <div className="mt-5 pt-3 border-t border-dashed border-slate-400 text-center space-y-2">
        <p className="text-[11px] font-bold">*** THANK YOU! ***</p>
        <p className="text-[10px] text-slate-600 leading-snug">
          We appreciate your visit.<br />
          Please come again!
        </p>
        <div className="pt-2">
          <p className="text-[9px] text-slate-400">Powered by Antigravity POS</p>
        </div>
      </div>

      {/* ═══ Print Styles ═══ */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { margin: 0; size: 80mm auto; }
          body * { visibility: hidden; }
          .receipt-card, .receipt-card * { visibility: visible; }
          .receipt-card {
            position: absolute; left: 0; top: 0;
            width: 80mm; max-width: 80mm;
            border: none; box-shadow: none;
            margin: 0; padding: 4mm;
            font-size: 11px;
          }
          .print\\:hidden { display: none !important; }
        }
      `}} />
    </div>
  );
}
