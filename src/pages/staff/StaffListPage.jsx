import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Filter, Eye, Edit, UserX } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import clsx from 'clsx';
import { getStaff, deactivateStaff } from '../../api/staff.api';
import { useAuthStore } from '../../store/auth.store';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import PageHeader from '../../components/ui/PageHeader';

export default function StaffListPage() {
  const { user: currentUser, hasRole } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Filters state
  const [filters, setFilters] = useState({
    branch_id: '',
    role: '',
    is_active: 'true',
  });

  // Deactivate modal state
  const [deactivateModal, setDeactivateModal] = useState({ isOpen: false, staff: null });

  const { data: staff, isLoading } = useQuery({
    queryKey: ['staff', filters],
    queryFn: () => getStaff(filters),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id) => deactivateStaff(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Staff member deactivated successfully');
      setDeactivateModal({ isOpen: false, staff: null });
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to deactivate staff');
    },
  });

  const columns = [
    {
      key: 'full_name',
      label: 'Staff Member',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-slate-200">
            {row.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-slate-900">{row.full_name}</p>
            <p className="text-[10px] text-slate-400 font-medium">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      render: (val) => <Badge variant="role">{val}</Badge>,
    },
    {
      key: 'staff_code',
      label: 'Login ID',
      render: (val) => (
        <span className="text-xs font-mono font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded border border-primary-100">
          {val || '—'}
        </span>
      ),
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (val) => val || '—',
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (val) => <Badge variant="status">{val ? 'Active' : 'Inactive'}</Badge>,
    },
    {
      key: 'actions',
      label: '',
      render: (_, row) => (
        <div className="flex justify-end gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0"
            onClick={() => navigate(`/staff/${row.id}`)}
          >
            <Eye size={16} />
          </Button>
          
          {hasRole('owner') && (
            <>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                onClick={() => navigate(`/staff/${row.id}/edit`)}
              >
                <Edit size={16} />
              </Button>
              {row.is_active && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => setDeactivateModal({ isOpen: true, staff: row })}
                >
                  <UserX size={16} />
                </Button>
              )}
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Staff Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage employee accounts and permissions across branches.</p>
        </div>
        {hasRole('owner') && (
          <Link to="/staff/new">
            <Button className="w-full sm:w-auto">
              <Plus size={18} className="mr-2" />
              Add Staff Member
            </Button>
          </Link>
        )}
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-end gap-4">


        <div className="flex-1 min-w-[200px]">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Role</label>
          <select 
            value={filters.role}
            onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
            className="w-full h-10 rounded-lg border-slate-200 text-sm focus:ring-primary-500"
          >
            <option value="">All Roles</option>
            <option value="manager">Manager</option>
            <option value="cashier">Cashier</option>
            <option value="waiter">Waiter</option>
            <option value="chef">Chef</option>
            <option value="driver">Driver</option>
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Status</label>
          <div className="flex h-10 bg-slate-100 rounded-lg p-1">
            <button 
              onClick={() => setFilters(prev => ({ ...prev, is_active: 'true' }))}
              className={clsx(
                "flex-1 text-xs font-bold rounded-md transition-all",
                filters.is_active === 'true' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              Active
            </button>
            <button 
              onClick={() => setFilters(prev => ({ ...prev, is_active: 'false' }))}
              className={clsx(
                "flex-1 text-xs font-bold rounded-md transition-all",
                filters.is_active === 'false' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              Inactive
            </button>
          </div>
        </div>
      </div>

      {/* Staff Table */}
      <Table 
        columns={columns}
        data={Array.isArray(staff?.staff) ? staff.staff : []}
        loading={isLoading}
        emptyMessage="No staff members found matching your filters."
      />

      {/* Deactivate Confirmation Modal */}
      <Modal
        isOpen={deactivateModal.isOpen}
        onClose={() => setDeactivateModal({ isOpen: false, staff: null })}
        title="Confirm Deactivation"
        footer={
          <>
            <Button 
              variant="outline" 
              onClick={() => setDeactivateModal({ isOpen: false, staff: null })}
            >
              Cancel
            </Button>
            <Button 
              variant="danger" 
              loading={deactivateMutation.isPending}
              onClick={() => deactivateMutation.mutate(deactivateModal.staff.id)}
            >
              Deactivate Staff
            </Button>
          </>
        }
      >
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 text-red-600 mb-4">
            <UserX size={24} />
          </div>
          <p className="text-sm text-slate-600">
            Are you sure you want to deactivate <span className="font-bold text-slate-900">{deactivateModal.staff?.full_name}</span>? 
            They will no longer be able to log in to the POS system.
          </p>
        </div>
      </Modal>
    </div>
  );
}
