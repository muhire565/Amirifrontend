import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, CheckCircle2, XCircle, Search, Package, AlertTriangle, LayoutGrid, List, Coffee, UtensilsCrossed } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getCategories, getItems, updateItem, deleteItem, restockBeverage } from '../../api/menu.api';
import { useAuthStore } from '../../store/auth.store';
import { formatUGX } from '../../utils/currency';
import { useRealtimeChannel } from '../../hooks/useRealtimeChannel';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { clsx } from 'clsx';

export default function MenuPage() {
  const { user, hasRole } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');

  // Real-time synchronization
  useRealtimeChannel('menu', (payload) => {
    queryClient.invalidateQueries(['menu-items']);
    queryClient.invalidateQueries(['categories']);
    if (payload?.payload?.action === 'created') {
      toast.success('Menu updated by another user');
    }
  });

  const { data: catResponse, isLoading: catLoading } = useQuery({
    queryKey: ['categories', user?.branch_id],
    queryFn: () => getCategories(user?.branch_id),
  });

  const { data: itemResponse, isLoading: itemsLoading } = useQuery({
    queryKey: ['menu-items', user?.branch_id],
    queryFn: () => getItems({ branch_id: user?.branch_id }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_available }) => updateItem(id, { is_available }),
    onSuccess: () => {
      queryClient.invalidateQueries(['menu-items']);
      toast.success('Availability updated');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['menu-items']);
      toast.success('Item removed');
    }
  });

  const restockMutation = useMutation({
    mutationFn: ({ id, quantity }) => restockBeverage(id, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries(['menu-items']);
      toast.success('Stock updated!');
    },
    onError: (err) => toast.error(err.message || 'Restock failed'),
  });

  const categories = catResponse?.categories || [];
  const allItems = itemResponse?.items || [];

  // Filter items by active category and search
  const filteredItems = useMemo(() => {
    let items = allItems;
    if (activeCategory !== 'all') {
      items = items.filter(i => i.category_id === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(i => i.name.toLowerCase().includes(q) || (i.description || '').toLowerCase().includes(q));
    }
    return items;
  }, [allItems, activeCategory, search]);

  // Stats
  const totalItems = allItems.length;
  const activeItems = allItems.filter(i => i.is_available).length;
  const lowStockItems = allItems.filter(i => i.track_stock && i.stock_quantity <= i.low_stock_threshold && i.stock_quantity > 0);
  const outOfStockItems = allItems.filter(i => i.track_stock && i.stock_quantity <= 0);

  // Get category name for an item
  const getCategoryName = (categoryId) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat?.name || '—';
  };

  if (catLoading || itemsLoading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-6">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Menu Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage items, categories, pricing & stock levels.</p>
        </div>
        {(hasRole('owner') || hasRole('manager')) && (
          <Link to="/menu/manage">
            <Button className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20 rounded-xl h-11 px-5 text-sm font-bold">
              <Plus size={16} className="mr-2" />
              Add Item
            </Button>
          </Link>
        )}
      </div>

      {/* ── Stats Row ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center">
              <UtensilsCrossed size={18} className="text-white" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{totalItems}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Items</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center">
              <CheckCircle2 size={18} className="text-white" />
            </div>
            <div>
              <p className="text-2xl font-black text-emerald-600">{activeItems}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500 flex items-center justify-center">
              <AlertTriangle size={18} className="text-white" />
            </div>
            <div>
              <p className="text-2xl font-black text-amber-600">{lowStockItems.length}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Low Stock</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-500 flex items-center justify-center">
              <XCircle size={18} className="text-white" />
            </div>
            <div>
              <p className="text-2xl font-black text-red-600">{outOfStockItems.length}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Out of Stock</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Category Tabs + Search ─────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-slate-100">
          {/* Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setActiveCategory('all')}
              className={clsx(
                'shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all',
                activeCategory === 'all'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
              )}
            >
              All ({totalItems})
            </button>
            {categories.map(cat => {
              const count = allItems.filter(i => i.category_id === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={clsx(
                    'shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all capitalize',
                    activeCategory === cat.id
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                  )}
                >
                  {cat.name} ({count})
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative shrink-0 w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 text-sm font-medium bg-slate-50 outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300"
            />
          </div>
        </div>

        {/* ── Items Table ──────────────────────────────────────────────── */}
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <Coffee size={28} className="text-slate-300" />
            </div>
            <p className="text-sm font-bold text-slate-400">No items found</p>
            <p className="text-xs text-slate-300 mt-1">Try a different category or search term</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">Item</th>
                  <th className="text-left px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">Category</th>
                  <th className="text-right px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">Price</th>
                  <th className="text-center px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">Stock</th>
                  <th className="text-center px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">Status</th>
                  {(hasRole('owner') || hasRole('manager')) && (
                    <th className="text-right px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredItems.map(item => (
                  <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                    {/* Item Name + Description */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={clsx(
                          'h-10 w-10 rounded-xl flex items-center justify-center shrink-0 text-white font-black text-sm',
                          item.track_stock ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-amber-500 to-orange-600'
                        )}>
                          {item.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className={clsx('text-sm font-bold text-slate-900 truncate max-w-[200px]', !item.is_available && 'line-through opacity-50')}>
                            {item.name}
                          </p>
                          {item.description && (
                            <p className="text-[11px] text-slate-400 truncate max-w-[200px]">{item.description}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-[11px] font-bold text-slate-600 capitalize">
                        {getCategoryName(item.category_id)}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="px-5 py-4 text-right">
                      <span className="text-sm font-black text-slate-900">{formatUGX(item.price)}</span>
                    </td>

                    {/* Stock */}
                    <td className="px-5 py-4 text-center">
                      {item.track_stock ? (
                        <span className={clsx(
                          'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide',
                          item.stock_quantity <= 0
                            ? 'bg-red-50 text-red-600 ring-1 ring-red-100'
                            : item.stock_quantity <= item.low_stock_threshold
                              ? 'bg-amber-50 text-amber-600 ring-1 ring-amber-100'
                              : 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100'
                        )}>
                          {item.stock_quantity <= 0 ? <AlertTriangle size={10} /> : <Package size={10} />}
                          {item.stock_quantity <= 0 ? 'Out' : item.stock_quantity}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-300 uppercase">N/A</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4 text-center">
                      <span className={clsx(
                        'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide',
                        item.is_available
                          ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100'
                          : 'bg-slate-100 text-slate-400 ring-1 ring-slate-200'
                      )}>
                        <span className={clsx('h-1.5 w-1.5 rounded-full', item.is_available ? 'bg-emerald-500' : 'bg-slate-300')} />
                        {item.is_available ? 'Active' : 'Disabled'}
                      </span>
                    </td>

                    {/* Actions */}
                    {(hasRole('owner') || hasRole('manager')) && (
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          {item.track_stock && (
                            <button
                              onClick={() => {
                                const qty = prompt(`Restock "${item.name}" \u2014 how many to add?`);
                                if (qty && Number(qty) > 0) restockMutation.mutate({ id: item.id, quantity: Number(qty) });
                              }}
                              className="h-8 px-2.5 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all flex items-center gap-1 ring-1 ring-emerald-100"
                              title="Restock"
                            >
                              <Package size={12} /> +Stock
                            </button>
                          )}
                          <button
                            onClick={() => toggleMutation.mutate({ id: item.id, is_available: !item.is_available })}
                            className={clsx(
                              'h-8 w-8 rounded-lg flex items-center justify-center transition-all',
                              item.is_available
                                ? 'bg-amber-50 text-amber-600 hover:bg-amber-100 ring-1 ring-amber-100'
                                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 ring-1 ring-emerald-100'
                            )}
                            title={item.is_available ? 'Disable' : 'Enable'}
                          >
                            {item.is_available ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
                          </button>
                          {hasRole('owner') && (
                            <>
                              <Link to={`/menu/manage?id=${item.id}`}>
                                <button className="h-8 w-8 rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700 flex items-center justify-center transition-all ring-1 ring-slate-100" title="Edit">
                                  <Edit size={14} />
                                </button>
                              </Link>
                              <button
                                onClick={() => { if (confirm(`Delete "${item.name}"?`)) deleteMutation.mutate(item.id); }}
                                className="h-8 w-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 flex items-center justify-center transition-all ring-1 ring-red-100"
                                title="Delete"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Low Stock Alert Banner ────────────────────────────────────── */}
      {lowStockItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-xl bg-amber-500 flex items-center justify-center shrink-0">
              <AlertTriangle size={16} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-amber-800">Low Stock Alert</h3>
              <p className="text-xs text-amber-600 mt-0.5">The following items are running low and need restocking:</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {lowStockItems.map(item => (
                  <span key={item.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg text-xs font-bold text-amber-700 ring-1 ring-amber-200 shadow-sm">
                    <Package size={11} />
                    {item.name} <span className="text-amber-500">({item.stock_quantity} left)</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
