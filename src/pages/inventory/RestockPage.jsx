import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Package, Truck, Phone, History } from 'lucide-react';
import { getStockItems, restockItem } from '../../api/inventory.api';
import { useAuthStore } from '../../store/auth.store';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { formatUGX } from '../../utils/currency';
import toast from 'react-hot-toast';

const RestockPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const preSelectedId = searchParams.get('stock_item_id');

  const [formData, setFormData] = useState({
    stock_item_id: preSelectedId || '',
    quantity_added: '',
    cost_per_unit: '',
    supplier_name: '',
    supplier_phone: '',
    notes: ''
  });

  const { data: items, isLoading: itemsLoading } = useQuery({
    queryKey: ['inventory-items', user?.branch_id],
    queryFn: () => getStockItems({ branch_id: user?.branch_id }),
  });

  const stockItems = items?.items || [];
  const selectedItem = stockItems.find(i => i.id === formData.stock_item_id);

  useEffect(() => {
    if (selectedItem) {
      setFormData(prev => ({ ...prev, cost_per_unit: selectedItem.cost_per_unit }));
    }
  }, [selectedItem]);

  const restockMutation = useMutation({
    mutationFn: restockItem,
    onSuccess: () => {
      queryClient.invalidateQueries(['inventory-items']);
      toast.success('Inventory restocked successfully');
      navigate('/inventory');
    },
    onError: (err) => toast.error(err.message || 'Failed to restock')
  });

  const totalCost = (parseFloat(formData.quantity_added) || 0) * (parseInt(formData.cost_per_unit) || 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.stock_item_id) return toast.error('Please select an item');
    restockMutation.mutate({
      ...formData,
      quantity_added: parseFloat(formData.quantity_added),
      cost_per_unit: parseInt(formData.cost_per_unit)
    });
  };

  if (itemsLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-2xl mx-auto pb-20">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 mb-6 transition-colors"
      >
        <ArrowLeft size={16} /> Back to Inventory
      </button>

      <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="bg-slate-900 p-10 text-white">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center text-primary-500">
              <Package size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter">Restock Inventory</h1>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Update your stock levels with new arrivals</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          <section className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Package size={14} className="text-primary-500" /> Item Selection
            </h3>
            <select 
              className="w-full h-12 rounded-2xl border-slate-200 text-sm font-bold focus:ring-primary-500 bg-slate-50"
              value={formData.stock_item_id}
              onChange={(e) => setFormData(prev => ({ ...prev, stock_item_id: e.target.value }))}
            >
              <option value="">Select an item to restock...</option>
              {stockItems.map(item => (
                <option key={item.id} value={item.id}>{item.name} ({item.current_quantity} {item.unit} available)</option>
              ))}
            </select>
          </section>

          <div className="grid grid-cols-2 gap-6">
            <Input 
              label={`Quantity Added (${selectedItem?.unit || 'qty'})`}
              type="number"
              step="0.001"
              required
              value={formData.quantity_added}
              onChange={(e) => setFormData(prev => ({ ...prev, quantity_added: e.target.value }))}
            />
            <Input 
              label="Cost Per Unit (UGX)"
              type="number"
              required
              value={formData.cost_per_unit}
              onChange={(e) => setFormData(prev => ({ ...prev, cost_per_unit: e.target.value }))}
            />
          </div>

          <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Total Restock Cost</p>
              <p className="text-2xl font-black text-emerald-700 tracking-tighter">{formatUGX(totalCost)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">New Stock Level</p>
              <p className="text-lg font-black text-emerald-700">
                {(parseFloat(selectedItem?.current_quantity || 0) + (parseFloat(formData.quantity_added) || 0)).toLocaleString()} {selectedItem?.unit}
              </p>
            </div>
          </div>

          <section className="space-y-4">
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Truck size={14} className="text-primary-500" /> Supplier Information
            </h3>
            <div className="grid grid-cols-2 gap-6">
               <Input 
                label="Supplier Name"
                placeholder="e.g. Fresh Produce Ltd"
                value={formData.supplier_name}
                onChange={(e) => setFormData(prev => ({ ...prev, supplier_name: e.target.value }))}
              />
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   <Phone size={12} /> Supplier Phone
                </label>
                <input 
                  type="text"
                  placeholder="07..."
                  className="w-full h-12 rounded-xl border-slate-200 text-sm font-bold focus:ring-primary-500"
                  value={formData.supplier_phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, supplier_phone: e.target.value }))}
                />
              </div>
            </div>
            <textarea 
              placeholder="Notes, receipt numbers, or quality observations..."
              className="w-full h-24 rounded-2xl border-slate-200 text-sm font-bold p-4 bg-slate-50 focus:ring-primary-500"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            />
          </section>

          <Button 
            type="submit" 
            className="w-full h-14 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-primary-500/20"
            loading={restockMutation.isPending}
            disabled={!formData.stock_item_id || !formData.quantity_added}
          >
            Confirm Restock
          </Button>
        </form>
      </div>
    </div>
  );
};

export default RestockPage;
