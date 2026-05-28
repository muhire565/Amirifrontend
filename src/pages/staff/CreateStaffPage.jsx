import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ArrowLeft, UserPlus, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { createStaff } from '../../api/staff.api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const staffSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().optional(),
  role: z.enum(['owner', 'manager', 'cashier', 'waiter', 'chef', 'driver']),
  pin: z.string().length(4, 'PIN must be exactly 4 digits').regex(/^\d+$/, 'PIN must be numeric'),
});

export default function CreateStaffPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      role: 'waiter',
    }
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await createStaff(data);
      toast.success('Staff member created successfully!');
      navigate('/staff');
    } catch (error) {
      toast.error(error.message || 'Failed to create staff member');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link 
        to="/staff" 
        className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-primary-600 transition-colors"
      >
        <ArrowLeft size={16} className="mr-1" />
        Back to Staff List
      </Link>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary-500 text-slate-900 flex items-center justify-center shadow-lg">
              <UserPlus size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Add New Staff Member</h1>
              <p className="text-sm text-slate-500">Initialize a new account for branch staff.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            
            {/* Primary Info */}
            <div className="space-y-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b pb-2">Basic Information</h3>
              <Input
                label="Full Name"
                placeholder="John Doe"
                {...register('full_name')}
                error={errors.full_name?.message}
              />
              <Input
                label="Email Address"
                type="email"
                placeholder="john@restaurant.com"
                {...register('email')}
                error={errors.email?.message}
              />
              <Input
                label="Phone Number"
                placeholder="07XXXXXXXX"
                {...register('phone')}
                error={errors.phone?.message}
              />
            </div>

            {/* Access & Role */}
            <div className="space-y-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b pb-2">Role & Branch</h3>
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
            </div>

            {/* Security */}
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 pt-4">
              <h3 className="md:col-span-2 text-xs font-bold text-slate-400 uppercase tracking-widest border-b pb-2">Security Credentials</h3>
              
              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 8 characters"
                  {...register('password')}
                  error={errors.password?.message}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 h-5 w-5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="relative">
                <Input
                  label="Login PIN (4 digits)"
                  type="password"
                  maxLength={4}
                  placeholder="••••"
                  {...register('pin')}
                  error={errors.pin?.message}
                />
                <div className="absolute right-3 top-9 h-5 w-5 text-slate-300 pointer-events-none">
                  <ShieldAlert size={18} />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end gap-4">
            <Link to="/staff">
              <Button variant="outline" type="button">Cancel</Button>
            </Link>
            <Button type="submit" loading={isLoading} className="min-w-[160px]">
              Create Staff Member
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
