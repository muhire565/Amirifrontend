import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle, 
  ArrowRight,
  Package,
  History,
  Activity,
  ArrowUpDown
} from 'lucide-react';
import { getStockItems, createStockItem } from '../../api/inventory.api';
import { useAuthStore } from '../../store/auth.store';
import StockItemCard from '../../components/inventory/StockItemCard';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import PageHeader from '../../components/ui/PageHeader';

const InventoryPage = () => {
  const { user, hasRole } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const { data: items, isLoading } = useQuery({
    queryKey: ['inventory-items', user?.branch_id],
    queryFn: () => getStockItems({ branch_id: user?.branch_id }),
  });

  const createMutation = useMutation({
    mutationFn: createStockItem,
    onSuccess: () => {
      queryClient.invalidateQueries(['inventory-items']);
      setIsAddModalOpen(false);
      setFormData({ name: '', unit: 'kg', current_quantity: 0, minimum_threshold: 0, cost_per_unit: 0, branch_id: user?.branch_id });
      toast.success('Stock item added successfully');
    },
    onError: (err) => {
      console.error("Create Stock Error:", err);
      console.error("Details:", JSON.stringify(err.details));
      if (err.details && Array.isArray(err.details)) {
        toast.error(err.details.map(d => d.msg).join(', '));
      } else {
        toast.error(err.message || 'Failed to add item');
      }
    }
  });

  const stockItems = Array.isArray(items?.items) ? items.items : [];
  const filteredItems = stockItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || item.unit.toLowerCase().includes(search.toLowerCase());
    const matchesLowStock = !filterLowStock || (item.current_quantity <= item.minimum_threshold);
    return matchesSearch && matchesLowStock;
  });

  const lowStockCount = stockItems.filter(i => i.current_quantity <= i.minimum_threshold).length;

  const [formData, setFormData] = useState({
    name: '',
    unit: 'kg',
    current_quantity: 0,
    minimum_threshold: 0,
    cost_per_unit: 0,
    branch_id: user?.branch_id
  });

  const handleAddSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      current_quantity: Number(formData.current_quantity) || 0,
      minimum_threshold: Number(formData.minimum_threshold) || 0,
      cost_per_unit: Number(formData.cost_per_unit) || 0,
      branch_id: user?.branch_id // ensure we have the latest
    };
    createMutation.mutate(payload);
  };

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Inventory" 
        subtitle="Manage stock levels, restocks, and wastage"
        rightSlot={
          <>
            {hasRole(['owner', 'manager']) && (
              <Button 
                onClick={() => setIsAddModalOpen(true)} 
                icon={Plus}
                variant="primary"
              >
                Add Stock Item
              </Button>
            )}
            <div className="flex bg-white rounded-full border border-slate-200 p-1 shadow-sm">
               <Link 
                to="/inventory/audit" 
                className="p-1.5 text-slate-400 hover:text-brand-primary transition-colors" 
                title="Inventory Audit"
              >
                 <History size={18} />
               </Link>
               <Link 
                to="/inventory/ingredients" 
                className="p-1.5 text-slate-400 hover:text-brand-primary transition-colors" 
                title="Ingredient Mapping"
              >
                 <Activity size={18} />
               </Link>
            </div>
          </>
        }
      />

      {/* Low Stock Alert Banner */}
      {lowStockCount > 0 && (
        <div className="bg-rose-500 p-4 rounded-3xl flex items-center justify-between text-white shadow-xl shadow-rose-500/20">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center">
              <AlertTriangle size={20} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest leading-none mb-1">{lowStockCount} Items are below threshold</p>
              <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest">Immediate restocking recommended to avoid service disruption.</p>
            </div>
          </div>
          <button 
            onClick={() => setFilterLowStock(true)}
            className="bg-white text-rose-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 transition-colors"
          >
            View Low Stock <ArrowRight size={14} className="inline ml-1" />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Search inventory items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 h-11 rounded-2xl border-slate-200 text-sm focus:ring-primary-500 font-bold bg-slate-50/50"
          />
        </div>
        
        <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-2xl">
          <button 
            onClick={() => setFilterLowStock(false)}
            className={clsx(
              "px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              !filterLowStock ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
            )}
          >
            All Items
          </button>
          <button 
            onClick={() => setFilterLowStock(true)}
            className={clsx(
              "px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              filterLowStock ? "bg-white text-rose-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
            )}
          >
            Low Stock Only
          </button>
        </div>
      </div>

      {/* Grid */}
      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[40px] border border-slate-100 opacity-30">
          <Package size={64} className="text-slate-300 mb-4" />
          <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No items found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {filteredItems.map(item => (
            <StockItemCard 
              key={item.id} 
              item={item} 
              canManage={hasRole(['owner', 'manager', 'chef'])}
              onRestock={(it) => navigate(`/inventory/restock?stock_item_id=${it.id}`)}
              onWastage={(it) => navigate(`/inventory/wastage?stock_item_id=${it.id}`)}
            />
          ))}
        </div>
      )}

      {/* Add Modal */}
      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Stock Item"
      >
        <form onSubmit={handleAddSubmit} className="space-y-6">
          <Input 
            label="Item Name" 
            placeholder="e.g. Tomato Paste" 
            required 
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unit</label>
              <select 
                className="w-full h-12 rounded-xl border-slate-200 text-sm font-bold focus:ring-primary-500"
                value={formData.unit}
                onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
              >
                {['kg', 'g', 'litres', 'ml', 'pieces', 'portions', 'bags', 'crates'].map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
            <Input 
              label="Min Threshold" 
              type="number" 
              required 
              value={formData.minimum_threshold === '' ? '' : formData.minimum_threshold}
              onChange={(e) => setFormData(prev => ({ ...prev, minimum_threshold: e.target.value === '' ? '' : parseFloat(e.target.value) }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Initial Quantity" 
              type="number" 
              required 
              value={formData.current_quantity === '' ? '' : formData.current_quantity}
              onChange={(e) => setFormData(prev => ({ ...prev, current_quantity: e.target.value === '' ? '' : parseFloat(e.target.value) }))}
            />
            <Input 
              label="Cost Per Unit (UGX)" 
              type="number" 
              required 
              value={formData.cost_per_unit === '' ? '' : formData.cost_per_unit}
              onChange={(e) => setFormData(prev => ({ ...prev, cost_per_unit: e.target.value === '' ? '' : parseInt(e.target.value) }))}
            />
          </div>

          <Button type="submit" className="w-full h-12 rounded-xl" loading={createMutation.isPending}>
            Add Item
          </Button>
        </form>
      </Modal>
    </div>
  );
};

export default InventoryPage;
