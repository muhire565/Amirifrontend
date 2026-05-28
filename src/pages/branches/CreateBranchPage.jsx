import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Store, MapPin, Save } from 'lucide-react';
import { createBranch, getBranchById, updateBranch } from '../../api/branches.api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Spinner from '../../components/ui/Spinner';

const branchSchema = z.object({
  name: z.string().min(2, 'Branch name must be at least 2 characters'),
  location: z.string().optional(),
});

export default function CreateBranchPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: branchData, isLoading: fetchLoading } = useQuery({
    queryKey: ['branches', id],
    queryFn: () => getBranchById(id),
    enabled: !!id,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(branchSchema),
  });

  useEffect(() => {
    if (id && branchData?.branch) {
      reset({
        name: branchData.branch.name,
        location: branchData.branch.location,
      });
    }
  }, [id, branchData, reset]);

  const mutation = useMutation({
    mutationFn: (data) => id ? updateBranch(id, data) : createBranch(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['branches']);
      toast.success(id ? 'Branch updated successfully!' : 'Branch created successfully!');
      navigate('/branches');
    },
    onError: (err) => {
      toast.error(err.message || 'Action failed');
    }
  });

  if (id && fetchLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link 
        to="/branches" 
        className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-primary-600 transition-colors"
      >
        <ArrowLeft size={16} className="mr-1" />
        Back to Branches
      </Link>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary-500 text-slate-900 flex items-center justify-center shadow-lg">
              <Store size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{id ? 'Edit Branch' : 'Create New Branch'}</h1>
              <p className="text-sm text-slate-500">Define a new physical restaurant location.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="p-8 space-y-6">
          <Input
            label="Branch Name"
            placeholder="e.g. Amiri Food — Ntinda Branch"
            {...register('name')}
            error={errors.name?.message}
          />

          <Input
            label="Location / Address"
            placeholder="e.g. Plot 42, Ntinda St, Kampala"
            {...register('location')}
            error={errors.location?.message}
          />

          <div className="pt-6 border-t border-slate-100 flex justify-end gap-4">
            <Link to="/branches">
              <Button variant="outline" type="button">Cancel</Button>
            </Link>
            <Button type="submit" loading={mutation.isPending} className="min-w-[140px]">
              <Save size={18} className="mr-2" />
              {id ? 'Save Changes' : 'Create Branch'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
