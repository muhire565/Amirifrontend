import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Building2, 
  Calendar, 
  ShieldCheck, 
  Edit, 
  UserX,
  History
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getStaffById, deactivateStaff } from '../../api/staff.api';
import { useAuthStore } from '../../store/auth.store';
import { formatDateTime } from '../../utils/format';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import { useState } from 'react';

export default function StaffDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasRole } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: response, isLoading, error } = useQuery({
    queryKey: ['staff', id],
    queryFn: () => getStaffById(id),
  });

  const staff = response?.staff;

  const deactivateMutation = useMutation({
    mutationFn: () => deactivateStaff(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['staff', id] });
      toast.success('Staff member deactivated successfully');
      setIsModalOpen(false);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to deactivate staff');
    },
  });

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (error) return <div className="text-center py-20 text-red-500">Error loading staff profile: {error.message}</div>;
  if (!staff) return <div className="text-center py-20">Staff member not found.</div>;

  const initials = staff.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link 
        to="/staff" 
        className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-primary-600 transition-colors"
      >
        <ArrowLeft size={16} className="mr-1" />
        Back to Staff List
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 flex flex-col items-center text-center">
            <div className="h-24 w-24 rounded-3xl bg-primary-500 text-slate-900 flex items-center justify-center text-3xl font-bold shadow-lg mb-4">
              {initials}
            </div>
            <h1 className="text-xl font-bold text-slate-900">{staff.full_name}</h1>
            <div className="flex flex-wrap justify-center gap-2 mt-3">
              <Badge variant="role">{staff.role}</Badge>
              <Badge variant="status">{staff.is_active ? 'Active' : 'Inactive'}</Badge>
            </div>
            
            {hasRole('owner') && (
              <div className="w-full grid grid-cols-2 gap-3 mt-8 pt-6 border-t border-slate-100">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate(`/staff/${id}/edit`)}
                >
                  <Edit size={16} className="mr-2" />
                  Edit
                </Button>
                {staff.is_active && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => setIsModalOpen(true)}
                  >
                    <UserX size={16} className="mr-2" />
                    Deactivate
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="bg-slate-900 rounded-2xl p-6 text-white overflow-hidden relative">
            <div className="relative z-10">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">System Access</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center">
                    <ShieldCheck size={18} className="text-primary-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Account ID</p>
                    <p className="text-sm font-mono font-bold">{staff.id.slice(0, 8)}...</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center">
                    <History size={18} className="text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Last Login</p>
                    <p className="text-sm font-bold">Today, 10:45 AM</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -right-4 -bottom-4 h-24 w-24 bg-primary-500/10 rounded-full blur-2xl" />
          </div>
        </div>

        {/* Details Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-base font-bold text-slate-900">Information Details</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              <DetailItem 
                icon={Mail} 
                label="Email Address" 
                value={staff.email} 
              />
              <DetailItem 
                icon={Phone} 
                label="Phone Number" 
                value={staff.phone || 'Not provided'} 
              />
              <DetailItem 
                icon={Building2} 
                label="Assigned Branch" 
                value={staff.branch_id ? `Branch ID: ${staff.branch_id.slice(0, 8)}` : 'Main Head Office'} 
              />
              <DetailItem 
                icon={Calendar} 
                label="Joined On" 
                value={formatDateTime(staff.created_at)} 
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <History size={18} className="text-slate-400" />
              Recent Activity
            </h3>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4 pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                  <div className="mt-1 h-2 w-2 rounded-full bg-slate-200" />
                  <div>
                    <p className="text-sm text-slate-700">
                      <span className="font-bold">Order Confirmed</span> - Table #12
                    </p>
                    <p className="text-xs text-slate-400 mt-1">2 hours ago</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Confirm Deactivation"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="danger" loading={deactivateMutation.isPending} onClick={() => deactivateMutation.mutate()}>
              Confirm Deactivation
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Are you sure you want to deactivate <span className="font-bold">{staff.full_name}</span>? 
          Access to the POS system will be revoked immediately.
        </p>
      </Modal>
    </div>
  );
}

function DetailItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-4">
      <div className="mt-1 p-2 bg-slate-100 rounded-lg text-slate-500">
        <Icon size={18} />
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-sm font-semibold text-slate-700 mt-0.5">{value}</p>
      </div>
    </div>
  );
}
