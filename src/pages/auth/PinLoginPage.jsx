import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Delete, X, Tablet, Check, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { pinLogin } from '../../api/auth.api';

// step: 'id' | 'pin'
export default function PinLoginPage() {
  const [step, setStep] = useState('id'); // 'id' first, then 'pin'
  const [staffNum, setStaffNum] = useState(''); // just the digits, e.g. "1001"
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  // The full staff_id sent to backend e.g. "S1001"
  const staffId = staffNum ? `S${staffNum}` : '';

  // ── Keypad handlers ─────────────────────────────────────────────────────────
  const handleNumberClick = (num) => {
    setError(false);
    if (step === 'id') {
      if (staffNum.length < 6) setStaffNum(prev => prev + num);
    } else {
      if (pin.length < 4) setPin(prev => prev + num);
    }
  };

  const handleBackspace = () => {
    if (step === 'id') {
      setStaffNum(prev => prev.slice(0, -1));
    } else {
      setPin(prev => prev.slice(0, -1));
    }
  };

  const handleClear = () => {
    if (step === 'id') {
      setStaffNum('');
    } else {
      setPin('');
      setError(false);
    }
  };

  // Advance from ID step to PIN step
  const handleConfirmId = () => {
    if (!staffNum) {
      toast.error('Please enter your Staff ID');
      return;
    }
    setStep('pin');
  };

  // Go back to ID step
  const handleGoBack = () => {
    setStep('id');
    setPin('');
    setError(false);
  };

  // Auto-submit when 4 PIN digits are entered
  useEffect(() => {
    if (step === 'pin' && pin.length === 4) {
      handlePinSubmit();
    }
  }, [pin, step]);

  const handlePinSubmit = async () => {
    if (!staffId || pin.length !== 4) return;
    setIsLoading(true);
    try {
      const response = await pinLogin({ staff_id: staffId, pin });
      const { token, user } = response;
      setAuth(token, user);
      toast.success(`Welcome, ${user.full_name}!`);
      navigate('/');
    } catch (err) {
      setError(true);
      setPin('');
      toast.error(err.message || 'Invalid Staff ID or PIN');
      const element = document.getElementById('pin-display');
      element?.classList.add('animate-shake');
      setTimeout(() => element?.classList.remove('animate-shake'), 500);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-white flex flex-col items-center justify-center p-6" style={{ background: '#090d1a' }}>
      <div className="w-full max-w-sm flex flex-col items-center">

        {/* Tablet badge */}
        <div className="mb-8 flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-medium text-slate-400" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
          <Tablet size={13} />
          <span>Optimized for tablet use</span>
        </div>

        <h1 className="text-3xl font-bold mb-1 text-center tracking-tight">Staff Login</h1>
        <p className="text-slate-500 mb-8 text-center text-sm">Enter your credentials to start your shift</p>

        {/* ── STEP INDICATOR ──────────────────────────────── */}
        <div className="flex items-center gap-3 mb-8">
          <div className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${step === 'id' ? 'text-amber-400' : 'text-slate-500'}`}>
            <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-black transition-colors ${step === 'id' ? 'bg-amber-400 text-black' : 'bg-slate-600 text-white'}`}>1</div>
            Staff ID
          </div>
          <ArrowRight size={12} className="text-slate-700" />
          <div className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${step === 'pin' ? 'text-amber-400' : 'text-slate-500'}`}>
            <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-black transition-colors ${step === 'pin' ? 'bg-amber-400 text-black' : 'bg-slate-700 text-white'}`}>2</div>
            PIN
          </div>
        </div>

        {/* ── DISPLAY AREA ─────────────────────────────────── */}
        {step === 'id' ? (
          <div className="w-full mb-8">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3 text-center">Staff ID</label>
            <div
              className="w-full h-16 rounded-2xl flex items-center justify-center text-3xl font-black tracking-widest transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '2px solid rgba(255,255,255,0.1)' }}
            >
              {staffNum
                ? <span><span className="text-slate-500">S</span>{staffNum}</span>
                : <span className="text-slate-600">e.g. S1001</span>
              }
            </div>
          </div>
        ) : (
          <div className="w-full mb-8">
            <div className="flex items-center justify-between mb-3">
              <button onClick={handleGoBack} className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-colors">
                ← {staffId}
              </button>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Enter PIN</label>
            </div>
            <div
              id="pin-display"
              className="w-full h-16 rounded-2xl flex items-center justify-center gap-6 transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: `2px solid ${error ? '#ef4444' : 'rgba(255,255,255,0.1)'}` }}
            >
              {[0, 1, 2, 3].map(i => (
                <div
                  key={i}
                  className="rounded-full transition-all duration-200"
                  style={{
                    width: 14, height: 14,
                    background: pin.length > i ? (error ? '#ef4444' : '#f59e0b') : 'transparent',
                    border: `2px solid ${pin.length > i ? (error ? '#ef4444' : '#f59e0b') : 'rgba(255,255,255,0.2)'}`,
                    transform: pin.length > i ? 'scale(1.2)' : 'scale(1)',
                    boxShadow: pin.length > i && !error ? '0 0 8px rgba(245,158,11,0.6)' : 'none',
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── NUMERIC KEYPAD ───────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3 w-full mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              onClick={() => handleNumberClick(num.toString())}
              className="h-16 rounded-2xl text-2xl font-bold transition-all active:scale-95 select-none"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
              onMouseDown={e => e.currentTarget.style.background = 'rgba(245,158,11,0.25)'}
              onMouseUp={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
            >
              {num}
            </button>
          ))}
          {/* Clear */}
          <button
            onClick={handleClear}
            className="h-16 rounded-2xl text-slate-400 hover:text-white transition-colors active:scale-95 flex items-center justify-center select-none"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <X size={22} />
          </button>
          {/* 0 */}
          <button
            onClick={() => handleNumberClick('0')}
            className="h-16 rounded-2xl text-2xl font-bold transition-all active:scale-95 select-none"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
            onMouseDown={e => e.currentTarget.style.background = 'rgba(245,158,11,0.25)'}
            onMouseUp={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
          >
            0
          </button>
          {/* Backspace */}
          <button
            onClick={handleBackspace}
            className="h-16 rounded-2xl text-slate-400 hover:text-white transition-colors active:scale-95 flex items-center justify-center select-none"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <Delete size={22} />
          </button>
        </div>

        {/* ── ACTION BUTTON ────────────────────────────────── */}
        {step === 'id' ? (
          <button
            onClick={handleConfirmId}
            disabled={!staffNum}
            className="w-full h-14 rounded-full text-base font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: staffNum ? 'linear-gradient(135deg, #d97706, #f59e0b)' : 'rgba(255,255,255,0.05)',
              color: staffNum ? '#000' : '#64748b',
            }}
          >
            <ArrowRight size={18} />
            Next — Enter PIN
          </button>
        ) : (
          <button
            onClick={handlePinSubmit}
            disabled={pin.length !== 4 || isLoading}
            className="w-full h-14 rounded-full text-base font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: pin.length === 4 ? 'linear-gradient(135deg, #d97706, #f59e0b)' : 'rgba(255,255,255,0.05)',
              color: pin.length === 4 ? '#000' : '#64748b',
            }}
          >
            {isLoading ? (
              <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
            ) : (
              <Check size={18} />
            )}
            Authorize
          </button>
        )}

        <Link
          to="/login"
          className="mt-6 text-slate-600 hover:text-slate-400 text-sm font-medium transition-colors"
        >
          Back to Email Login
        </Link>
      </div>
    </div>
  );
}
