import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  Clock, 
  CheckCircle2,
  MapPin,
  User,
  Phone,
  Truck,
  CreditCard
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getCategories, getItems } from '../../api/menu.api';
import { createDelivery } from '../../api/delivery.api';
import { useAuthStore } from '../../store/auth.store';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import { formatUGX } from '../../utils/currency';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const CreateDeliveryPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [activeCategory, setActiveCategory] = useState('');
  const [basket, setBasket] = useState([]);
  
  const [deliveryInfo, setDeliveryInfo] = useState({
    customer_name: '',
    customer_phone: '',
    delivery_address: '',
    delivery_zone: '',
    delivery_notes: '',
    delivery_fee: 0,
    payment_method: 'cash_on_delivery',
    notes: ''
  });

  const { data: catResponse } = useQuery({
    queryKey: ['categories', user?.branch_id],
    queryFn: () => getCategories({ branch_id: user?.branch_id }),
    onSuccess: (data) => {
      if (data.categories?.length > 0 && !activeCategory) {
        setActiveCategory(data.categories[0].id);
      }
    }
  });

  const { data: itemResponse, isLoading: itemsLoading } = useQuery({
    queryKey: ['menu-items', user?.branch_id, activeCategory],
    queryFn: () => getItems({ branch_id: user?.branch_id, category_id: activeCategory, is_available: true }),
    enabled: !!activeCategory
  });

  const addToBasket = (item) => {
    setBasket(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, menu_item_id: item.id, quantity: 1, special_instructions: '' }];
    });
  };

  const updateQty = (id, delta) => {
    setBasket(prev => prev.map(i => {
      if (i.id === id) {
        const newQty = Math.max(1, i.quantity + delta);
        return { ...i, quantity: newQty };
      }
      return i;
    }));
  };

  const removeItem = (id) => setBasket(prev => prev.filter(i => i.id !== id));

  const subtotal = useMemo(() => basket.reduce((acc, i) => acc + (i.price * i.quantity), 0), [basket]);
  const vat = subtotal * 0.18;
  const deliveryFee = parseInt(deliveryInfo.delivery_fee) || 0;
  const total = subtotal + vat + deliveryFee;

  const deliveryMutation = useMutation({
    mutationFn: (data) => createDelivery(data),
    onSuccess: (data) => {
      toast.success('Delivery order created successfully!');
      navigate(`/delivery/${data.delivery.id}`);
    },
    onError: (err) => toast.error(err.message || 'Failed to create delivery')
  });

  const handleCreateDelivery = () => {
    if (basket.length === 0) return toast.error('Basket is empty');
    if (!deliveryInfo.customer_name || !deliveryInfo.customer_phone || !deliveryInfo.delivery_address) {
        return toast.error('Please fill in required customer details');
    }
    
    deliveryMutation.mutate({
      ...deliveryInfo,
      order_type: 'delivery',
      items: basket.map(i => ({
        menu_item_id: i.menu_item_id,
        quantity: i.quantity,
        special_instructions: i.special_instructions
      })),
      delivery_fee: parseInt(deliveryInfo.delivery_fee) || 0
    });
  };

  const isPhoneValid = /^(07\d{8}|2567\d{8})$/.test(deliveryInfo.customer_phone);

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] bg-slate-50 overflow-hidden rounded-[40px] border border-slate-200 shadow-xl">
      <div className="bg-white px-8 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="h-10 w-10 flex items-center justify-center hover:bg-slate-50 rounded-xl transition-colors border border-slate-100 text-slate-500">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tighter leading-none">New Delivery</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Setup customer and order details</p>
          </div>
        </div>
        <Badge variant="primary" className="h-8 px-4 font-black">{basket.length} ITEMS IN BASKET</Badge>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: Customer Setup */}
        <div className="w-1/3 bg-white border-r border-slate-100 p-8 overflow-y-auto space-y-8">
          <section className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <User size={14} className="text-primary-500" /> Customer Information
            </h3>
            <div className="space-y-4">
               <Input 
                label="Full Name" 
                placeholder="Customer Name" 
                required 
                value={deliveryInfo.customer_name}
                onChange={(e) => setDeliveryInfo(prev => ({ ...prev, customer_name: e.target.value }))}
              />
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   <Phone size={12} /> Phone Number
                </label>
                <div className="relative">
                  <input 
                    type="text"
                    placeholder="07..."
                    className={clsx(
                      "w-full h-12 rounded-xl border-2 px-4 text-sm font-bold transition-all focus:ring-0",
                      deliveryInfo.customer_phone ? (isPhoneValid ? "border-emerald-500 bg-emerald-50/20" : "border-rose-500 bg-rose-50/20") : "border-slate-100 bg-slate-50"
                    )}
                    value={deliveryInfo.customer_phone}
                    onChange={(e) => setDeliveryInfo(prev => ({ ...prev, customer_phone: e.target.value }))}
                  />
                  {deliveryInfo.customer_phone && !isPhoneValid && (
                    <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mt-1">Invalid Uganda Number</p>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
             <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <MapPin size={14} className="text-primary-500" /> Delivery Details
            </h3>
            <textarea 
              placeholder="Delivery Address (Required)"
              className="w-full h-24 rounded-2xl border-2 border-slate-100 bg-slate-50 p-4 text-sm font-bold focus:ring-primary-500 focus:border-primary-500"
              value={deliveryInfo.delivery_address}
              onChange={(e) => setDeliveryInfo(prev => ({ ...prev, delivery_address: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-4">
               <Input 
                label="Zone" 
                placeholder="e.g. Ntinda" 
                value={deliveryInfo.delivery_zone}
                onChange={(e) => setDeliveryInfo(prev => ({ ...prev, delivery_zone: e.target.value }))}
              />
              <Input 
                label="Fee (UGX)" 
                type="number"
                value={deliveryInfo.delivery_fee}
                onChange={(e) => setDeliveryInfo(prev => ({ ...prev, delivery_fee: e.target.value }))}
              />
            </div>
            <textarea 
              placeholder="Directions / Landmarks..."
              className="w-full h-20 rounded-2xl border-2 border-slate-100 bg-slate-50 p-4 text-xs font-bold focus:ring-primary-500 focus:border-primary-500"
              value={deliveryInfo.delivery_notes}
              onChange={(e) => setDeliveryInfo(prev => ({ ...prev, delivery_notes: e.target.value }))}
            />
          </section>

          <section className="space-y-4">
             <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <CreditCard size={14} className="text-primary-500" /> Payment Method
            </h3>
            <select 
              className="w-full h-12 rounded-xl border-2 border-slate-100 bg-slate-50 px-4 text-sm font-bold focus:ring-primary-500"
              value={deliveryInfo.payment_method}
              onChange={(e) => setDeliveryInfo(prev => ({ ...prev, payment_method: e.target.value }))}
            >
              <option value="cash_on_delivery">Cash on Delivery</option>
              <option value="prepaid_cash">Prepaid Cash (at counter)</option>
              <option value="prepaid_airtel">Prepaid Airtel Money</option>
              <option value="prepaid_mtn">Prepaid MTN Mobile Money</option>
            </select>
          </section>
        </div>

        {/* CENTER: Menu Selection */}
        <div className="flex-1 flex flex-col bg-slate-50/50 overflow-hidden">
          <div className="px-6 py-4 bg-white border-b border-slate-100 overflow-x-auto whitespace-nowrap scrollbar-hide flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">Categories:</span>
            {catResponse?.categories?.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={clsx(
                  "px-5 py-2.5 rounded-2xl text-[10px] font-black transition-all uppercase tracking-widest",
                  activeCategory === cat.id 
                    ? "bg-slate-900 text-white shadow-lg" 
                    : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-100"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-8">
            {itemsLoading ? (
              <div className="flex justify-center py-20"><Spinner size="lg" /></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {itemResponse?.items?.map(item => (
                  <div 
                    key={item.id}
                    onClick={() => addToBasket(item)}
                    className="group bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:border-primary-500 transition-all cursor-pointer relative overflow-hidden"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-black text-slate-900 text-sm tracking-tight">{item.name}</h4>
                      <span className="text-xs font-black text-primary-600">{formatUGX(item.price)}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-2 mb-4 font-bold leading-relaxed">{item.description || 'No description available.'}</p>
                    <div className="flex items-center gap-1 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      <Clock size={12} />
                      <span>{item.prep_time_minutes} MINS PREP</span>
                    </div>
                    <div className="absolute right-0 bottom-0 h-12 w-12 bg-slate-900 text-white flex items-center justify-center translate-y-full group-hover:translate-y-0 transition-transform rounded-tl-2xl">
                       <Plus size={20} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Basket */}
        <div className="w-80 bg-white border-l border-slate-100 flex flex-col shadow-2xl relative z-10">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
             <div className="flex items-center gap-2">
                <ShoppingCart size={20} className="text-primary-500" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Basket</h3>
             </div>
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{basket.length} items</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {basket.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-10 opacity-20">
                <ShoppingCart size={48} className="text-slate-300 mb-4" />
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-relaxed">Add menu items to start your delivery order</p>
              </div>
            ) : (
              basket.map(item => (
                <div key={item.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                  <div className="flex justify-between items-start">
                    <h5 className="text-xs font-black text-slate-900 line-clamp-2">{item.name}</h5>
                    <button onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-rose-500 transition-colors p-1">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center bg-white rounded-xl border border-slate-200 h-9 p-1">
                      <button onClick={() => updateQty(item.id, -1)} className="w-8 h-full flex items-center justify-center text-slate-400 hover:text-slate-900"><Minus size={14} /></button>
                      <span className="w-8 text-center text-xs font-black">{item.quantity}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="w-8 h-full flex items-center justify-center text-slate-400 hover:text-slate-900"><Plus size={14} /></button>
                    </div>
                    <span className="text-xs font-black text-slate-900">{formatUGX(item.price * item.quantity)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-6 bg-slate-900 text-white rounded-t-[40px] shadow-[0_-10px_40px_rgba(0,0,0,0.15)]">
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <span>Items Subtotal</span>
                <span>{formatUGX(subtotal)}</span>
              </div>
              <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <span>VAT (18%)</span>
                <span>{formatUGX(vat)}</span>
              </div>
              <div className="flex justify-between text-[10px] font-black text-primary-400 uppercase tracking-widest">
                <span>Delivery Fee</span>
                <span>{formatUGX(deliveryFee)}</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-white/10">
                <span className="text-sm font-black uppercase tracking-widest">Grand Total</span>
                <span className="text-xl font-black text-primary-500 leading-none">{formatUGX(total)}</span>
              </div>
            </div>

            <Button 
              className="w-full h-14 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-primary-500/20"
              loading={deliveryMutation.isPending}
              disabled={basket.length === 0 || !deliveryInfo.customer_name || !isPhoneValid || !deliveryInfo.delivery_address}
              onClick={handleCreateDelivery}
            >
              <CheckCircle2 size={18} className="mr-2" />
              Place Delivery Order
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateDeliveryPage;
