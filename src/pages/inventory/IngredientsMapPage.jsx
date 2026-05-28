import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  ChefHat, 
  Search, 
  Trash2, 
  Plus, 
  Save, 
  AlertCircle,
  Link as LinkIcon
} from 'lucide-react';
import { getStockItems, setMenuIngredients, getMenuIngredients } from '../../api/inventory.api';
import { getItems as getMenuItems } from '../../api/menu.api';
import { useAuthStore } from '../../store/auth.store';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { formatUGX } from '../../utils/currency';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

const IngredientsMapPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedMenuItem, setSelectedMenuItem] = useState('');
  const [ingredients, setIngredients] = useState([]);

  // Fetch all stock items for the branch
  const { data: stockItems } = useQuery({
    queryKey: ['inventory-items', user?.branch_id],
    queryFn: () => getStockItems({ branch_id: user?.branch_id }),
  });

  // Fetch all menu items
  const { data: menuItems, isLoading: menuLoading } = useQuery({
    queryKey: ['menu-items-all', user?.branch_id],
    queryFn: () => getMenuItems({ branch_id: user?.branch_id }),
  });

  // Fetch existing ingredients for selected menu item
  const { data: existingIngredients, isLoading: ingredientsLoading } = useQuery({
    queryKey: ['menu-ingredients', selectedMenuItem],
    queryFn: () => getMenuIngredients(selectedMenuItem),
    enabled: !!selectedMenuItem,
  });

  useEffect(() => {
    if (existingIngredients) {
      setIngredients(existingIngredients.map(ing => ({
        id: ing.id,
        stock_item_id: ing.stock_item_id,
        quantity_used: ing.quantity_used
      })));
    }
  }, [existingIngredients]);

  const saveMutation = useMutation({
    mutationFn: (data) => setMenuIngredients({ menu_item_id: selectedMenuItem, ingredients: data }),
    onSuccess: () => {
      queryClient.invalidateQueries(['menu-ingredients', selectedMenuItem]);
      toast.success('Ingredients mapping updated');
    },
    onError: (err) => toast.error(err.message || 'Failed to save mappings')
  });

  const addIngredient = () => {
    setIngredients([...ingredients, { stock_item_id: '', quantity_used: 0 }]);
  };

  const removeIngredient = (index) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index, field, value) => {
    const updated = [...ingredients];
    updated[index][field] = value;
    setIngredients(updated);
  };

  const handleSave = () => {
    if (!selectedMenuItem) return;
    const validIngredients = ingredients.filter(ing => ing.stock_item_id && ing.quantity_used > 0);
    saveMutation.mutate(validIngredients);
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/inventory')}
          className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Inventory
        </button>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-primary-500 text-slate-900 rounded-2xl flex items-center justify-center">
              <ChefHat size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter text-slate-900">Ingredient Mapping</h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Link menu items to the stock they consume</p>
            </div>
          </div>

          <div className="w-full md:w-80">
            <select 
              className="w-full h-12 rounded-2xl border-slate-200 text-sm font-bold focus:ring-primary-500 bg-slate-50"
              value={selectedMenuItem}
              onChange={(e) => setSelectedMenuItem(e.target.value)}
            >
              <option value="">Select a menu item...</option>
              {menuItems?.items?.map(item => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-8">
          {!selectedMenuItem ? (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
               <LinkIcon size={48} className="text-slate-300 mb-4" />
               <p className="text-sm font-black text-slate-500 uppercase tracking-widest">Select a menu item to start mapping ingredients</p>
            </div>
          ) : ingredientsLoading ? (
            <div className="flex justify-center py-20"><Spinner size="lg" /></div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                {ingredients.map((ing, index) => {
                  const stockItem = (stockItems?.items || []).find(s => s.id === ing.stock_item_id);
                  const servingsPossible = stockItem ? Math.floor(stockItem.current_quantity / ing.quantity_used) : 0;

                  return (
                    <div key={index} className="flex flex-col md:flex-row items-end md:items-center gap-4 p-5 rounded-3xl bg-slate-50 border border-slate-100 group">
                      <div className="flex-1 w-full space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Stock Item</label>
                        <select 
                          className="w-full h-11 rounded-xl border-slate-200 text-sm font-bold focus:ring-primary-500 bg-white"
                          value={ing.stock_item_id}
                          onChange={(e) => updateIngredient(index, 'stock_item_id', e.target.value)}
                        >
                          <option value="">Select ingredient...</option>
                          {stockItems?.items?.map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({s.unit})</option>
                          ))}
                        </select>
                      </div>

                      <div className="w-full md:w-32 space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Qty Used</label>
                        <input 
                          type="number"
                          step="0.0001"
                          className="w-full h-11 rounded-xl border-slate-200 text-sm font-bold focus:ring-primary-500 bg-white"
                          value={ing.quantity_used}
                          onChange={(e) => updateIngredient(index, 'quantity_used', parseFloat(e.target.value))}
                        />
                      </div>

                      {stockItem && (
                        <div className="w-full md:w-40 flex flex-col justify-center px-4">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Stock Availability</p>
                           <div className="flex items-center gap-2">
                             <div className={clsx(
                               "h-2 w-2 rounded-full",
                               servingsPossible > 20 ? "bg-emerald-500" : servingsPossible > 5 ? "bg-amber-500" : "bg-rose-500"
                             )} />
                             <span className="text-xs font-black text-slate-900">{servingsPossible} servings left</span>
                           </div>
                        </div>
                      )}

                      <button 
                        onClick={() => removeIngredient(index)}
                        className="h-11 w-11 flex items-center justify-center text-slate-300 hover:text-rose-500 transition-colors bg-white rounded-xl border border-slate-100 shadow-sm"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-100">
                <button 
                  onClick={addIngredient}
                  className="flex items-center gap-2 text-[10px] font-black text-primary-600 uppercase tracking-widest hover:text-primary-700 transition-colors"
                >
                  <Plus size={16} /> Add Another Ingredient
                </button>

                <Button 
                  onClick={handleSave} 
                  className="w-full md:w-auto px-10 h-12 rounded-2xl shadow-xl shadow-primary-500/10"
                  loading={saveMutation.isPending}
                >
                  <Save size={18} className="mr-2" />
                  Save Mappings
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IngredientsMapPage;
