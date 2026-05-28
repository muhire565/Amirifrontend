import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Edit3, ShieldAlert, UserCheck } from 'lucide-react';
import { getStaffById, updateStaff } from '../../api/staff.api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Spinner from '../../components/ui/Spinner';

const editStaffSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional().nullable(),
  role: z.enum(['owner', 'manager', 'cashier', 'waiter', 'chef', 'driver']),
  is_active: z.boolean(),
  pin: z.string().refine(val => val === '' || (val.length === 4 && /^\d+$/.test(val)), {
    message: 'PIN must be exactly 4 digits'
  }).optional(),
});

export default function EditStaffPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: response, isLoading: fetching } = useQuery({
    queryKey: ['staff', id],
    queryFn: () => getStaffById(id),
  });

  const staff = response?.staff;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(editStaffSchema),
  });

  useEffect(() => {
    if (staff) {
      reset({
        full_name: staff.full_name,
        phone: staff.phone,
        role: staff.role,
        is_active: staff.is_active,
        pin: '', // Default PIN field to empty
      });
    }
  }, [staff, reset]);

  const updateMutation = useMutation({
    mutationFn: (data) => {
      // Only include PIN if it's provided
      const payload = { ...data };
      if (!payload.pin) delete payload.pin;
      return updateStaff(id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['staff', id] });
      toast.success('Staff member updated successfully!');
      navigate(`/staff/${id}`);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update staff member');
    },
  });

  if (fetching) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link 
        to={`/staff/${id}`} 
        className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-primary-600 transition-colors"
      >
        <ArrowLeft size={16} className="mr-1" />
        Back to Profile
      </Link>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-lg">
              <Edit3 size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Edit Staff Member</h1>
              <p className="text-sm text-slate-500">Update account details for <span className="font-bold">{staff.full_name}</span></p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit((data) => updateMutation.mutate(data))} className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            
            {/* Account Info */}
            <div className="space-y-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b pb-2">Account Details</h3>
              <Input
                label="Full Name"
                {...register('full_name')}
                error={errors.full_name?.message}
              />
              <div className="w-full">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Staff Role</label>
                <select 
                  className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                  {...register('role')}
                >
                  <option value="owner">Owner</option>
                  <option value="manager">Manager</option>
                  <option value="cashier">Cashier</option>
                  <option value="waiter">Waiter</option>
                  <option value="chef">Chef</option>
                  <option value="driver">Driver</option>
                </select>
                {errors.role && <p className="mt-1.5 text-xs text-red-500">{errors.role.message}</p>}
              </div>
              <Input
                label="Phone Number"
                {...register('phone')}
                error={errors.phone?.message}
              />
            </div>

            {/* Status & Security */}
            <div className="space-y-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b pb-2">Security</h3>
              
              <div className="relative">
                <Input
                  label="Update Login PIN (4 digits)"
                  type="password"
                  maxLength={4}
                  placeholder="Leave blank to keep current"
                  {...register('pin')}
                  error={errors.pin?.message}
                />
                <div className="absolute right-3 top-9 h-5 w-5 text-slate-300 pointer-events-none">
                  <ShieldAlert size={18} />
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <input 
                  type="checkbox" 
                  id="is_active"
                  className="h-5 w-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  {...register('is_active')}
                />
                <label htmlFor="is_active" className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  Account is Active
                  <UserCheck size={16} className="text-green-500" />
                </label>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end gap-4">
            <Link to={`/staff/${id}`}>
              <Button variant="outline" type="button">Cancel</Button>
            </Link>
            <Button type="submit" loading={updateMutation.isPending} className="min-w-[160px]">
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
