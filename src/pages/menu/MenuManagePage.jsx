import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { ArrowLeft, PlusCircle, LayoutGrid, DollarSign, Clock, FileText, Package } from 'lucide-react';
import { getCategories, createItem, updateItem, createCategory, getItems } from '../../api/menu.api';
import { useAuthStore } from '../../store/auth.store';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Spinner from '../../components/ui/Spinner';

const menuSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional().nullable(),
  price: z.preprocess((val) => Number(val), z.number().positive('Price must be a positive number')),
  prep_time_minutes: z.preprocess((val) => Number(val), z.number().min(0, 'Prep time cannot be negative')),
  category_id: z.string().min(1, 'Category is required'),
  branch_id: z.string().nullable().optional().or(z.literal('')),
  track_stock: z.boolean().optional().default(false),
  stock_quantity: z.preprocess((val) => Number(val), z.number().min(0).optional()).default(0),
  low_stock_threshold: z.preprocess((val) => Number(val), z.number().min(0).optional()).default(5),
});

export default function MenuManagePage() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const { data: catResponse } = useQuery({
    queryKey: ['categories', user?.branch_id],
    queryFn: () => getCategories(user?.branch_id),
  });

  const { data: itemResponse, isLoading: itemLoading } = useQuery({
    queryKey: ['menu-items', id],
    queryFn: () => getItems({ id }),
    enabled: !!id,
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(menuSchema),
    defaultValues: {
      branch_id: user?.branch_id,
      prep_time_minutes: 15,
      track_stock: false,
      stock_quantity: 0,
      low_stock_threshold: 5,
    }
  });

  useEffect(() => {
    if (id && itemResponse?.items?.[0]) {
      const item = itemResponse.items[0];
      reset({
        name: item.name,
        description: item.description,
        price: item.price,
        prep_time_minutes: item.prep_time_minutes,
        category_id: item.category_id,
        branch_id: item.branch_id,
        track_stock: item.track_stock || false,
        stock_quantity: item.stock_quantity || 0,
        low_stock_threshold: item.low_stock_threshold || 5,
      });
    }
  }, [id, itemResponse, reset]);

  const saveMutation = useMutation({
    mutationFn: (data) => id ? updateItem(id, data) : createItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['menu-items']);
      toast.success(id ? 'Item updated!' : 'Item created!');
      navigate('/menu');
    },
    onError: (err) => {
      toast.error(err.message || 'Action failed');
    }
  });

  const categoryMutation = useMutation({
    mutationFn: (name) => createCategory({ name, branch_id: user?.branch_id }),
    onSuccess: () => {
      queryClient.invalidateQueries(['categories']);
      toast.success('Category created!');
      setIsCreatingCategory(false);
      setNewCatName('');
    }
  });

  if (id && itemLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link 
        to="/menu" 
        className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-primary-600 transition-colors"
      >
        <ArrowLeft size={16} className="mr-1" />
        Back to Menu
      </Link>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary-500 text-slate-900 flex items-center justify-center shadow-lg">
              <PlusCircle size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{id ? 'Edit Menu Item' : 'Add New Menu Item'}</h1>
              <p className="text-sm text-slate-500">Configure item details, pricing, and category.</p>
            </div>
          </div>
        </div>

        <form 
          onSubmit={handleSubmit(
            (data) => saveMutation.mutate(data),
            (errs) => console.error('Form Validation Errors:', errs)
          )} 
          className="p-8 space-y-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            
            {/* Left Col */}
            <div className="space-y-6">
              <Input
                label="Item Name"
                placeholder="e.g. Traditional Beef Luwombo"
                {...register('name')}
                error={errors.name?.message}
              />
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Category</label>
                <div className="flex gap-2">
                  <select 
                    className="flex-1 h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-primary-500"
                    {...register('category_id')}
                  >
                    <option value="">Select Category</option>
                    {catResponse?.categories?.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  <button 
                    type="button"
                    onClick={() => setIsCreatingCategory(!isCreatingCategory)}
                    className="px-3 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    <PlusCircle size={20} />
                  </button>
                </div>
                {isCreatingCategory && (
                   <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 mt-2 flex gap-2">
                      <input 
                        type="text" 
                        placeholder="New Category Name"
                        className="flex-1 h-9 bg-white border border-slate-200 rounded-lg text-xs px-3"
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                      />
                      <Button 
                        size="sm" 
                        type="button" 
                        loading={categoryMutation.isPending}
                        onClick={() => categoryMutation.mutate(newCatName)}
                      >
                        Add
                      </Button>
                   </div>
                )}
                {errors.category_id && <p className="text-xs text-red-500">{errors.category_id.message}</p>}
              </div>

              <Input
                label="Pricing (UGX)"
                type="number"
                placeholder="25000"
                {...register('price')}
                error={errors.price?.message}
              />
            </div>

            {/* Right Col */}
            <div className="space-y-6">
              <Input
                label="Preparation Time (Minutes)"
                type="number"
                placeholder="15"
                {...register('prep_time_minutes')}
                error={errors.prep_time_minutes?.message}
              />
              
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">Description</label>
                <textarea 
                  className="w-full rounded-lg border-slate-300 text-sm p-3 focus:ring-primary-500 min-h-[120px]"
                  placeholder="Describe the dish ingredients and taste profile..."
                  {...register('description')}
                />
                {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
              </div>

              {/* Stock Tracking Section */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                    {...register('track_stock')}
                  />
                  <div className="flex items-center gap-2">
                    <Package size={16} className="text-amber-500" />
                    <span className="text-sm font-bold text-slate-700">Track Stock</span>
                  </div>
                </label>
                <p className="text-xs text-slate-400 -mt-2 ml-8">Enable for beverages like sodas to track bottles sold & remaining.</p>

                {watch('track_stock') && (
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <Input
                      label="Current Stock"
                      type="number"
                      placeholder="e.g. 24"
                      {...register('stock_quantity')}
                      error={errors.stock_quantity?.message}
                    />
                    <Input
                      label="Low Stock Alert At"
                      type="number"
                      placeholder="e.g. 5"
                      {...register('low_stock_threshold')}
                      error={errors.low_stock_threshold?.message}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end gap-4">
            <Link to="/menu">
              <Button variant="outline" type="button">Cancel</Button>
            </Link>
            <Button type="submit" loading={saveMutation.isPending} className="min-w-[160px]">
              {id ? 'Save Changes' : 'Create Item'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
