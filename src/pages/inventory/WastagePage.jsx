import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Trash2, AlertCircle, ClipboardList } from 'lucide-react';
import { getStockItems, logWastage } from '../../api/inventory.api';
import { useAuthStore } from '../../store/auth.store';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { formatUGX } from '../../utils/currency';
import toast from 'react-hot-toast';

const WastagePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const preSelectedId = searchParams.get('stock_item_id');

  const [formData, setFormData] = useState({
    stock_item_id: preSelectedId || '',
    quantity_wasted: '',
    reason: '',
    notes: ''
  });

  const { data: items, isLoading: itemsLoading } = useQuery({
    queryKey: ['inventory-items', user?.branch_id],
    queryFn: () => getStockItems({ branch_id: user?.branch_id }),
  });

  const stockItems = items?.items || [];
  const selectedItem = stockItems.find(i => i.id === formData.stock_item_id);

  const wastageMutation = useMutation({
    mutationFn: logWastage,
    onSuccess: () => {
      queryClient.invalidateQueries(['inventory-items']);
      toast.success('Wastage logged successfully');
      navigate('/inventory');
    },
    onError: (err) => toast.error(err.message || 'Failed to log wastage')
  });

  const estimatedLoss = (parseFloat(formData.quantity_wasted) || 0) * (selectedItem?.cost_per_unit || 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.stock_item_id) return toast.error('Please select an item');
    if (parseFloat(formData.quantity_wasted) > (selectedItem?.current_quantity || 0)) {
        return toast.error('Wasted quantity cannot exceed current stock');
    }
    wastageMutation.mutate({
      ...formData,
      quantity_wasted: parseFloat(formData.quantity_wasted)
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
        <div className="bg-rose-600 p-10 text-white">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <Trash2 size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter">Log Wastage</h1>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Report spoiled, damaged, or lost inventory</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          <section className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <ClipboardList size={14} className="text-rose-500" /> Item Identification
            </h3>
            <select 
              className="w-full h-12 rounded-2xl border-slate-200 text-sm font-bold focus:ring-primary-500 bg-slate-50"
              value={formData.stock_item_id}
              onChange={(e) => setFormData(prev => ({ ...prev, stock_item_id: e.target.value }))}
            >
              <option value="">Select wasted item...</option>
              {stockItems.map(item => (
                <option key={item.id} value={item.id}>{item.name} ({item.current_quantity} {item.unit} available)</option>
              ))}
            </select>
          </section>

          <div className="grid grid-cols-2 gap-6">
            <Input 
              label={`Quantity Wasted (${selectedItem?.unit || 'qty'})`}
              type="number"
              step="0.001"
              required
              value={formData.quantity_wasted}
              onChange={(e) => setFormData(prev => ({ ...prev, quantity_wasted: e.target.value }))}
            />
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Wastage Reason</label>
              <select 
                className="w-full h-12 rounded-xl border-slate-200 text-sm font-bold focus:ring-primary-500 bg-white"
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                required
              >
                <option value="">Select reason...</option>
                <option value="spoiled">Spoiled / Expired</option>
                <option value="cooking_error">Cooking / Prep Error</option>
                <option value="spillage">Spillage / Dropped</option>
                <option value="pests">Pest Damage</option>
                <option value="theft">Unaccounted Loss (Theft)</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Estimated Financial Loss</p>
              <p className="text-2xl font-black text-rose-700 tracking-tighter">{formatUGX(estimatedLoss)}</p>
            </div>
            <div className="h-10 w-10 bg-rose-200/50 rounded-xl flex items-center justify-center text-rose-600">
              <AlertCircle size={20} />
            </div>
          </div>

          <section className="space-y-4">
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Additional Details</h3>
            <textarea 
              placeholder="Provide more context on how the wastage occurred..."
              className="w-full h-32 rounded-2xl border-slate-200 text-sm font-bold p-4 bg-slate-50 focus:ring-primary-500"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            />
          </section>

          <Button 
            type="submit" 
            className="w-full h-14 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-rose-500/10 bg-rose-600 hover:bg-rose-700 text-white"
            loading={wastageMutation.isPending}
            disabled={!formData.stock_item_id || !formData.quantity_wasted || !formData.reason}
          >
            Report Wastage
          </Button>
        </form>
      </div>
    </div>
  );
};

export default WastagePage;
