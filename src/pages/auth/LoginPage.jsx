import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff, Lock, Mail, UtensilsCrossed, ArrowRight, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { login as loginApi } from '../../api/auth.api';
import clsx from 'clsx';

const loginSchema = z.object({
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const response = await loginApi(data);
      const { token, user } = response;

      setAuth(token, user);
      toast.success(`Welcome back, ${user.full_name}!`);
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F8F9FC] relative overflow-hidden">
      {/* ── LEFT: Branding Panel (hidden on mobile, visible on lg+) ── */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative flex-col justify-between p-10 overflow-hidden"
        style={{ background: '#0A0F1E' }}
      >
        {/* Animated background shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full opacity-[0.07]"
            style={{ background: 'radial-gradient(circle, #4F46E5 0%, transparent 70%)' }} />
          <div className="absolute bottom-10 right-10 h-[300px] w-[300px] rounded-full opacity-[0.06]"
            style={{ background: 'radial-gradient(circle, #06B6D4 0%, transparent 70%)' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full opacity-[0.03]"
            style={{ background: 'radial-gradient(circle, #4F46E5 0%, transparent 70%)' }} />
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

        {/* Top: Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #4F46E5, #06B6D4)' }}>
              <UtensilsCrossed size={20} className="text-white" strokeWidth={2} />
            </div>
            <span className="text-white font-black text-lg tracking-tight">Amiri POS</span>
          </div>
        </div>

        {/* Center: Big message */}
        <div className="relative z-10 max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 mb-6">
            <Sparkles size={12} className="text-amber-400" />
            <span className="text-[11px] font-black text-white/70 uppercase tracking-widest">Restaurant Management System</span>
          </div>
          <h2 className="text-4xl xl:text-5xl font-black text-white leading-[1.1] tracking-tight">
            Run your restaurant<br />
            <span style={{ background: 'linear-gradient(135deg, #818CF8, #06B6D4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              like a pro
            </span>
          </h2>
          <p className="text-slate-400 text-[15px] font-medium mt-5 leading-relaxed max-w-sm">
            Streamlined orders, real-time kitchen, smart inventory, and effortless billing — all in one place.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-3 mt-8">
            {['Smart Orders', 'Live KDS', 'Table Map', 'Inventory'].map(f => (
              <div key={f} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="text-[12px] font-bold text-white/80">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: stats */}
        <div className="relative z-10 flex items-center gap-8">
          <div>
            <p className="text-2xl font-black text-white">24/7</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Online Support</p>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div>
            <p className="text-2xl font-black text-white">99.9%</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Uptime</p>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div>
            <p className="text-2xl font-black text-white">Enterprise</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Grade Security</p>
          </div>
        </div>
      </div>

      {/* ── RIGHT: Login Form ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-5 sm:p-8 lg:p-12 relative z-10">
        {/* Mobile brand (only on small screens) */}
        <div className="lg:hidden text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg, #4F46E5, #06B6D4)', boxShadow: '0 12px 40px rgba(79,70,229,0.25)' }}>
            <UtensilsCrossed size={26} className="text-white" strokeWidth={2} />
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Amiri's Food Restaurant</h1>
          <p className="text-slate-400 text-[13px] font-medium mt-1">Sign in to access the POS system</p>
        </div>

        <div className="w-full max-w-[420px]">
          {/* Desktop header text */}
          <div className="hidden lg:block mb-8">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Welcome back</h2>
            <p className="text-slate-400 text-[13px] font-medium mt-1">Enter your credentials to continue</p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-[24px] border border-slate-200/80 shadow-xl shadow-slate-200/30 p-7 sm:p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Email Address</label>
                <div className={clsx(
                  "relative flex items-center rounded-xl border-2 transition-all duration-200",
                  errors.email ? "border-red-300 bg-red-50/30" :
                  focusedField === 'email' ? "border-indigo-400 bg-white shadow-[0_0_0_4px_rgba(79,70,229,0.08)]" :
                  "border-slate-200 bg-slate-50/50 hover:border-slate-300"
                )}>
                  <Mail size={16} className={clsx(
                    "absolute left-3.5 shrink-0",
                    errors.email ? "text-red-400" : focusedField === 'email' ? "text-indigo-500" : "text-slate-400"
                  )} />
                  <input
                    type="email"
                    placeholder="name@restaurant.com"
                    className="w-full h-12 pl-10 pr-4 bg-transparent text-[14px] font-semibold text-slate-900 placeholder:text-slate-300 outline-none rounded-xl"
                    {...register('email')}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1.5 text-[11px] font-bold text-red-500 flex items-center gap-1">
                    <span className="inline-block h-1 w-1 rounded-full bg-red-500" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Password</label>
                <div className={clsx(
                  "relative flex items-center rounded-xl border-2 transition-all duration-200",
                  errors.password ? "border-red-300 bg-red-50/30" :
                  focusedField === 'password' ? "border-indigo-400 bg-white shadow-[0_0_0_4px_rgba(79,70,229,0.08)]" :
                  "border-slate-200 bg-slate-50/50 hover:border-slate-300"
                )}>
                  <Lock size={16} className={clsx(
                    "absolute left-3.5 shrink-0",
                    errors.password ? "text-red-400" : focusedField === 'password' ? "text-indigo-500" : "text-slate-400"
                  )} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="w-full h-12 pl-10 pr-11 bg-transparent text-[14px] font-semibold text-slate-900 placeholder:text-slate-300 outline-none rounded-xl"
                    {...register('password')}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-[11px] font-bold text-red-500 flex items-center gap-1">
                    <span className="inline-block h-1 w-1 rounded-full bg-red-500" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Submit */}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={clsx(
                    "w-full h-[52px] rounded-xl text-[14px] font-black text-white transition-all duration-300 flex items-center justify-center gap-2",
                    "shadow-lg shadow-indigo-500/20",
                    isLoading
                      ? "opacity-70 cursor-not-allowed"
                      : "hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5 active:translate-y-0"
                  )}
                  style={{ background: isLoading ? '#6366F1' : 'linear-gradient(135deg, #4F46E5, #06B6D4)' }}
                >
                  {isLoading ? (
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight size={16} strokeWidth={2.5} />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* PIN Login */}
            <div className="mt-7 pt-6 border-t border-slate-100 text-center">
              <p className="text-[13px] font-medium text-slate-400">
                Using a POS tablet?{' '}
                <Link to="/pin" className="font-black text-indigo-600 hover:text-indigo-700 transition-colors inline-flex items-center gap-1">
                  PIN Login <ArrowRight size={12} />
                </Link>
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-[11px] font-bold text-slate-400 mt-6 uppercase tracking-widest">
            Protected by Amiri's Security System &bull; &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
