import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Utensils, 
  User,
  Users,
  Plus, 
  Minus, 
  Trash2, 
  CheckCircle2, 
  Clock,
  ShoppingCart,
  Search,
  Tag,
  Package,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getCategories, getItems } from '../../api/menu.api';
import { getTables } from '../../api/tables.api';
import { getStaff } from '../../api/staff.api';
import { createOrder } from '../../api/orders.api';
import { useAuthStore } from '../../store/auth.store';
import { formatUGX } from '../../utils/currency';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import { clsx } from 'clsx';

export default function CreateOrderPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  const [basket, setBasket] = useState([]);
  const [menuSearch, setMenuSearch] = useState('');
  const [orderInfo, setOrderInfo] = useState({
    table_id: searchParams.get('table_id') || '',
    waiter_id: '',
    order_type: 'dine_in',
    notes: '',
    covers: 1,
  });

  // Fetch all categories
  const { data: catResponse } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories(),
  });

  // Fetch ALL available menu items at once (no category filter)
  const { data: itemResponse, isLoading: itemsLoading } = useQuery({
    queryKey: ['menu-items-all'],
    queryFn: () => getItems({ is_available: true }),
  });

  // Tables (show all that have available seats)
  const { data: tableResponse } = useQuery({
    queryKey: ['tables-for-order'],
    queryFn: () => getTables({}),
  });

  // Waiters — fetch ALL active waiters (no branch filter since single-branch)
  const { data: waiterResponse } = useQuery({
    queryKey: ['waiters-all'],
    queryFn: () => getStaff({ role: 'waiter', is_active: 'true' }),
  });

  const categories = catResponse?.categories || [];
  const allItems = itemResponse?.items || [];

  // Group items by category, filtered by search
  const groupedMenu = useMemo(() => {
    const search = menuSearch.toLowerCase().trim();
    return categories.map(cat => {
      const items = allItems.filter(item => {
        const inCategory = item.category_id === cat.id;
        if (!inCategory) return false;
        if (!search) return true;
        return item.name.toLowerCase().includes(search) || (item.description || '').toLowerCase().includes(search);
      });
      return { ...cat, items };
    }).filter(cat => cat.items.length > 0);
  }, [categories, allItems, menuSearch]);

  // Basket Logic
  const addToBasket = (item) => {
    // Prevent adding out-of-stock tracked items
    if (item.track_stock && item.stock_quantity <= 0) {
      toast.error(`${item.name} is out of stock!`);
      return;
    }
    setBasket(prev => {
      const existing = prev.find(i => i.id === item.id);
      // Prevent exceeding stock for tracked items
      if (item.track_stock && existing && existing.quantity >= item.stock_quantity) {
        toast.error(`Only ${item.stock_quantity} ${item.name} available`);
        return prev;
      }
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1, special_instructions: '' }];
    });
    toast.success(`${item.name} added to basket`, { icon: '🛒', duration: 1200 });
  };

  const updateQty = (id, delta) => {
    setBasket(prev => prev.map(i => {
      if (i.id === id) {
        const newQty = i.quantity + delta;
        if (newQty <= 0) return null;
        return { ...i, quantity: newQty };
      }
      return i;
    }).filter(Boolean));
  };

  const removeItem = (id) => {
    setBasket(prev => prev.filter(i => i.id !== id));
    toast.error('Item removed from basket', { duration: 1000 });
  };

  // Totals
  const subtotal = useMemo(() => basket.reduce((acc, i) => acc + (i.price * i.quantity), 0), [basket]);
  const vat = subtotal * 0.18;
  const total = subtotal + vat;

  // Mutation
  const orderMutation = useMutation({
    mutationFn: (data) => createOrder(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['orders']);
      queryClient.invalidateQueries(['tables']);
      queryClient.invalidateQueries(['tables-for-order']);
      queryClient.invalidateQueries(['kds-orders']);
      toast.success('Order placed successfully! 🎉');
      navigate(`/orders/${data.order.id}`);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to place order. Try again.');
    }
  });

  const handlePlaceOrder = () => {
    if (!orderInfo.table_id) {
      toast.error('Please select a table first.');
      return;
    }
    if (!orderInfo.waiter_id) {
      toast.error('Please assign a waiter to this order.');
      return;
    }
    if (basket.length === 0) {
      toast.error('Your basket is empty. Add some items!');
      return;
    }

    const payload = {
      ...orderInfo,
      items: basket.map(i => ({
        menu_item_id: i.id,
        quantity: i.quantity,
        special_instructions: i.special_instructions
      }))
    };

    orderMutation.mutate(payload);
  };

  const basketItemCount = basket.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] bg-slate-50 overflow-hidden rounded-3xl border border-slate-200 shadow-xl">
      
      {/* ── Top Header ─────────────────────────────────────────── */}
      <div className="bg-white px-4 sm:px-6 py-3 border-b border-slate-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link to="/tables" className="h-9 w-9 flex items-center justify-center hover:bg-slate-50 rounded-xl transition-colors border border-slate-100 text-slate-500">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-base font-black text-slate-900 tracking-tight leading-none">New Order</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              {searchParams.get('table_number') ? `Table ${searchParams.get('table_number')}` : 'Select a table'}
            </p>
          </div>
        </div>
        <Badge variant="primary" className="h-7 px-3 text-[10px] font-black">
          <ShoppingCart size={11} className="mr-1" />
          {basketItemCount} ITEMS
        </Badge>
      </div>

      <div className="flex flex-1 overflow-hidden min-h-0">

        {/* ── LEFT: Setup Column ──────────────────────────────────── */}
        <div className="w-56 sm:w-64 bg-white border-r border-slate-100 p-4 overflow-y-auto space-y-5 shrink-0">
          
          {/* Table Select */}
          <section>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
              <Utensils size={12} className="text-amber-500" /> Table
            </h3>
            <select
              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-400 font-bold bg-slate-50 outline-none"
              value={orderInfo.table_id}
              onChange={(e) => setOrderInfo(prev => ({ ...prev, table_id: e.target.value }))}
            >
              <option value="">— Select Table —</option>
              {(tableResponse?.tables || []).filter(t => (t.available_seats ?? t.capacity) > 0).map(t => (
                <option key={t.id} value={t.id}>T-{t.table_number} ({t.available_seats ?? t.capacity}/{t.capacity} free)</option>
              ))}
            </select>
          </section>

          {/* Guests / Covers */}
          <section>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
              <Users size={12} className="text-amber-500" /> Guests
            </h3>
            <input
              type="number"
              min="1"
              max={(() => { const t = (tableResponse?.tables || []).find(t => t.id === orderInfo.table_id); return t ? (t.available_seats ?? t.capacity) : 10; })()}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-400 font-bold bg-slate-50 outline-none"
              value={orderInfo.covers}
              onChange={(e) => setOrderInfo(prev => ({ ...prev, covers: Math.max(1, parseInt(e.target.value) || 1) }))}
            />
          </section>

          {/* Waiter Select */}
          <section>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
              <User size={12} className="text-amber-500" /> Waiter
            </h3>
            <select
              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-400 font-bold bg-slate-50 outline-none"
              value={orderInfo.waiter_id}
              onChange={(e) => setOrderInfo(prev => ({ ...prev, waiter_id: e.target.value }))}
            >
              <option value="">— Select Waiter —</option>
              {waiterResponse?.staff?.map(w => (
                <option key={w.id} value={w.id}>{w.full_name}</option>
              ))}
            </select>
            {waiterResponse?.staff?.length === 0 && (
              <p className="text-[10px] text-rose-400 font-bold mt-1.5">No active waiters found.</p>
            )}
          </section>

          {/* Order Type */}
          <section>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Order Type</h3>
            <div className="grid grid-cols-2 gap-1.5">
              {[['dine_in', 'Dine In'], ['takeaway', 'Takeaway']].map(([type, label]) => (
                <button
                  key={type}
                  onClick={() => setOrderInfo(prev => ({ ...prev, order_type: type }))}
                  className={clsx(
                    "py-2 rounded-xl text-[9px] font-black transition-all border-2 uppercase tracking-widest",
                    orderInfo.order_type === type
                      ? "bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-500/20"
                      : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          {/* Notes */}
          <section>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Special Notes</h3>
            <textarea
              className="w-full rounded-xl border border-slate-200 text-xs p-3 focus:ring-2 focus:ring-amber-400 min-h-[70px] bg-slate-50 outline-none resize-none"
              placeholder="e.g. No salt, extra spicy..."
              value={orderInfo.notes}
              onChange={(e) => setOrderInfo(prev => ({ ...prev, notes: e.target.value }))}
            />
          </section>
        </div>

        {/* ── CENTER: Menu (grouped by category) ─────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          
          {/* Search bar */}
          <div className="px-4 py-3 bg-white border-b border-slate-100 shrink-0">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search menu items..."
                value={menuSearch}
                onChange={e => setMenuSearch(e.target.value)}
                className="w-full h-9 pl-8 pr-4 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          {/* Scrollable grouped menu */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {itemsLoading ? (
              <div className="flex justify-center py-20"><Spinner size="lg" /></div>
            ) : groupedMenu.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
                <Utensils size={48} className="text-slate-300 mb-3" />
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No menu items found</p>
              </div>
            ) : (
              groupedMenu.map(category => (
                <div key={category.id}>
                  {/* Category Header */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-6 w-6 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                      <Tag size={12} className="text-amber-600" />
                    </div>
                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">{category.name}</h2>
                    <div className="flex-1 h-px bg-slate-200" />
                    <span className="text-[10px] font-bold text-slate-400">{category.items.length} items</span>
                  </div>

                  {/* Items in this category */}
                  <div className="space-y-2 pl-2">
                    {category.items.map(item => {
                      const inBasket = basket.find(b => b.id === item.id);
                      return (
                        <div
                          key={item.id}
                          className={clsx(
                            "flex items-center justify-between p-3 rounded-2xl border transition-all",
                            inBasket
                              ? "bg-amber-50 border-amber-300 shadow-sm"
                              : "bg-white border-slate-100 hover:border-amber-200 hover:shadow-sm"
                          )}
                        >
                          {/* Item info */}
                          <div className="flex-1 min-w-0 mr-3">
                            <div className="flex items-baseline gap-2">
                              <p className="text-sm font-bold text-slate-900 truncate">{item.name}</p>
                              {inBasket && (
                                <span className="text-[9px] font-black text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full uppercase tracking-widest shrink-0">
                                  x{inBasket.quantity} in basket
                                </span>
                              )}
                            </div>
                            {item.description && (
                              <p className="text-[10px] text-slate-400 font-medium mt-0.5 truncate">{item.description}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-sm font-black text-amber-600">{formatUGX(item.price)}</p>
                              {item.track_stock && (
                                <span className={clsx(
                                  'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase',
                                  item.stock_quantity <= 0
                                    ? 'bg-red-100 text-red-600'
                                    : item.stock_quantity <= (item.low_stock_threshold || 5)
                                      ? 'bg-amber-100 text-amber-700'
                                      : 'bg-emerald-50 text-emerald-600'
                                )}>
                                  {item.stock_quantity <= 0 ? <><AlertTriangle size={8} /> Out</> : <><Package size={8} /> {item.stock_quantity}</>}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Add Button */}
                          {inBasket ? (
                            <div className="flex items-center gap-1 bg-white rounded-xl border border-amber-200 h-9 shrink-0 shadow-sm">
                              <button
                                onClick={() => updateQty(item.id, -1)}
                                className="w-9 h-full flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors rounded-l-xl"
                              >
                                <Minus size={13} />
                              </button>
                              <span className="w-6 text-center text-sm font-black text-slate-900">{inBasket.quantity}</span>
                              <button
                                onClick={() => addToBasket(item)}
                                className="w-9 h-full flex items-center justify-center text-amber-600 hover:text-amber-800 transition-colors rounded-r-xl"
                              >
                                <Plus size={13} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToBasket(item)}
                              disabled={item.track_stock && item.stock_quantity <= 0}
                              className={clsx(
                                "h-9 w-9 rounded-xl flex items-center justify-center shadow-md transition-all shrink-0",
                                item.track_stock && item.stock_quantity <= 0
                                  ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                                  : "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/30 hover:scale-105"
                              )}
                            >
                              <Plus size={16} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── RIGHT: Basket Column ────────────────────────────────── */}
        <div className="w-64 sm:w-72 bg-white border-l border-slate-100 flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
            <div className="flex items-center gap-2">
              <ShoppingCart size={16} className="text-amber-500" />
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Basket</h3>
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{basketItemCount} items</span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
            {basket.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-4 space-y-3 opacity-20">
                <ShoppingCart size={40} className="text-slate-400" />
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Add items from the menu</p>
              </div>
            ) : (
              basket.map(item => (
                <div key={item.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="text-xs font-bold text-slate-900 leading-tight flex-1 mr-2 line-clamp-2">{item.name}</h5>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-slate-300 hover:text-red-500 transition-colors shrink-0"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center bg-white rounded-lg border border-slate-200 h-7">
                      <button onClick={() => updateQty(item.id, -1)} className="w-7 h-full flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors rounded-l-lg">
                        <Minus size={11} />
                      </button>
                      <span className="w-5 text-center text-xs font-black text-slate-900">{item.quantity}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="w-7 h-full flex items-center justify-center text-slate-400 hover:text-amber-600 transition-colors rounded-r-lg">
                        <Plus size={11} />
                      </button>
                    </div>
                    <span className="text-xs font-black text-amber-600">{formatUGX(item.price * item.quantity)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Totals + Place Order */}
          <div className="p-4 bg-slate-900 text-white space-y-3 shrink-0">
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <span>Subtotal</span>
                <span className="text-slate-300">{formatUGX(subtotal)}</span>
              </div>
              <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <span>VAT (18%)</span>
                <span className="text-slate-300">{formatUGX(vat)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-white/10">
                <span className="text-[10px] font-black uppercase tracking-widest text-white">Total Payable</span>
                <span className="text-base font-black text-amber-400">{formatUGX(total)}</span>
              </div>
            </div>

            <Button
              className="w-full h-11 rounded-xl text-xs font-black uppercase tracking-widest bg-amber-500 hover:bg-amber-400 text-slate-900 border-0 shadow-xl shadow-amber-500/20"
              loading={orderMutation.isPending}
              disabled={basket.length === 0 || !orderInfo.table_id || !orderInfo.waiter_id}
              onClick={handlePlaceOrder}
            >
              <CheckCircle2 size={15} className="mr-2" />
              Place Order
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
