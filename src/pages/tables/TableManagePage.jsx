import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, LayoutGrid, Users, Trash2, Edit, Store, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getTables, createTable, deleteTable, updateTable } from '../../api/tables.api';
import { getBranches } from '../../api/branches.api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Table from '../../components/ui/Table';
import Spinner from '../../components/ui/Spinner';

export default function TableManagePage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  
  const { data: tableResponse, isLoading: tablesLoading } = useQuery({
    queryKey: ['tables-all'],
    queryFn: () => getTables(),
  });

  const { data: branchResponse } = useQuery({
    queryKey: ['branches'],
    queryFn: getBranches,
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editingTable ? updateTable(editingTable.id, data) : createTable(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tables-all']);
      toast.success(editingTable ? 'Table updated' : 'Table created');
      setIsModalOpen(false);
      setEditingTable(null);
    },
    onError: (err) => {
      toast.error(err.message || 'Action failed');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTable,
    onSuccess: () => {
      queryClient.invalidateQueries(['tables-all']);
      toast.success('Table removed');
    }
  });

  const columns = [
    {
      key: 'table_number',
      label: 'Table #',
      render: (val) => <span className="font-bold text-slate-900">Table {val}</span>
    },
    {
      key: 'branch_name',
      label: 'Branch',
      render: (_, row) => (
        <div className="flex items-center gap-2 text-slate-500">
          <Store size={14} />
          <span className="text-sm">{row.branch_name || 'N/A'}</span>
        </div>
      )
    },
    {
      key: 'capacity',
      label: 'Capacity',
      render: (val) => (
        <div className="flex items-center gap-1.5 text-slate-500">
          <Users size={14} />
          <span className="text-sm font-medium">{val} Seats</span>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Current Status',
      render: (val) => (
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
          val === 'available' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
        }`}>
          {val}
        </span>
      )
    },
    {
      key: 'actions',
      label: '',
      render: (_, row) => (
        <div className="flex justify-end gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-9 w-9 p-0 rounded-xl"
            onClick={() => {
              setEditingTable(row);
              setIsModalOpen(true);
            }}
          >
            <Edit size={16} />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-9 w-9 p-0 rounded-xl text-red-500 hover:bg-red-50"
            onClick={() => {
              if (confirm('Delete this table?')) deleteMutation.mutate(row.id);
            }}
          >
            <Trash2 size={16} />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link to="/tables" className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-bold text-slate-900">Floor Management</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1 ml-9">Configure and manage tables across all restaurant branches.</p>
        </div>
        <Button onClick={() => { setEditingTable(null); setIsModalOpen(true); }}>
          <Plus size={18} className="mr-2" />
          Add Table
        </Button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <Table 
          columns={columns}
          data={tableResponse?.tables || []}
          loading={tablesLoading}
          emptyMessage="No tables found. Add your first table to a branch."
        />
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-primary-500 text-slate-900 flex items-center justify-center shadow-lg">
                <LayoutGrid size={20} />
              </div>
              <h2 className="text-lg font-bold text-slate-900">{editingTable ? 'Edit Table' : 'Add New Table'}</h2>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              saveMutation.mutate({
                table_number: formData.get('table_number'),
                capacity: parseInt(formData.get('capacity')),
                branch_id: formData.get('branch_id'),
              });
            }} className="p-8 space-y-6">
              <Input 
                label="Table Number / Name" 
                name="table_number" 
                defaultValue={editingTable?.table_number}
                placeholder="e.g. 10 or VIP-1" 
                required 
              />
              
              <Input 
                label="Seating Capacity" 
                name="capacity" 
                type="number" 
                defaultValue={editingTable?.capacity || 4}
                required 
              />

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Branch Location</label>
                <select 
                  name="branch_id"
                  defaultValue={editingTable?.branch_id}
                  required
                  className="w-full h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm focus:ring-2 focus:ring-primary-500 transition-all"
                >
                  <option value="">Select a Branch</option>
                  {branchResponse?.branches?.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" type="button" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button className="flex-1" type="submit" loading={saveMutation.isPending}>
                  {editingTable ? 'Update' : 'Create'} Table
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
