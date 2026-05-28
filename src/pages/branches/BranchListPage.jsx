import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Store, MapPin, Trash2, Edit } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getBranches, deleteBranch } from '../../api/branches.api';
import { useAuthStore } from '../../store/auth.store';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import PageHeader from '../../components/ui/PageHeader';
import clsx from 'clsx';

export default function BranchListPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const { data: response, isLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: getBranches,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBranch,
    onSuccess: () => {
      queryClient.invalidateQueries(['branches']);
      toast.success('Branch deleted successfully');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to delete branch');
    }
  });

  const columns = [
    {
      key: 'name',
      label: 'Branch Name',
      render: (val) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
            <Store size={20} />
          </div>
          <span className="font-bold text-slate-900">{val}</span>
        </div>
      )
    },
    {
      key: 'location',
      label: 'Location',
      render: (val) => (
        <div className="flex items-center gap-2 text-slate-500">
          <MapPin size={14} />
          <span className="text-sm">{val || 'Not specified'}</span>
        </div>
      )
    },
    {
      key: 'created_at',
      label: 'Date Added',
      render: (val) => <span className="text-sm text-slate-400">{new Date(val).toLocaleDateString()}</span>
    },
    {
      key: 'actions',
      label: '',
      render: (_, row) => (
        <div className="flex justify-end gap-2">
          <Link to={`/branches/${row.id}/edit`}>
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-xl">
              <Edit size={16} />
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-9 w-9 p-0 rounded-xl text-red-500 hover:bg-red-50"
            onClick={() => {
              if (confirm('Are you sure you want to delete this branch?')) {
                deleteMutation.mutate(row.id);
              }
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
      <PageHeader 
        title="Branch Management" 
        subtitle="Manage your restaurant locations and metadata."
        rightSlot={
          <Link to="/branches/new">
            <Button>
              <Plus size={18} className="mr-2" />
              Add New Branch
            </Button>
          </Link>
        }
      />

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <Table 
          columns={columns}
          data={Array.isArray(response?.branches) ? response.branches : []}
          loading={isLoading}
          emptyMessage="No branches found. Start by adding your first location."
        />
      </div>
    </div>
  );
}
