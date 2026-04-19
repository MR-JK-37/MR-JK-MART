import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Unlock, Lock, User, KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GlassModal from '../ui/GlassModal';
import GlassButton from '../ui/GlassButton';
import useAppStore from '../../store/useAppStore';
import useToastStore from '../../store/useToastStore';
import { verifyAdminKey, hasAdminKey } from '../../crypto/adminAuth';

export default function AdminGate({ isOpen, onClose }) {
  const [step, setStep] = useState(1); // 1 = identity, 2 = key entry
  const [key, setKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const navigate = useNavigate();
  const setAdmin = useAppStore(s => s.setAdmin);
  const toast = useToastStore();

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setKey('');
      setError('');
      checkLockout();
    }
  }, [isOpen]);

  useEffect(() => {
    let interval;
    if (countdown > 0) {
      interval = setInterval(() => {
        const lockout = localStorage.getItem('mrjk_lockout');
        if (lockout) {
          const remaining = Math.ceil((parseInt(lockout) - Date.now()) / 1000);
          if (remaining <= 0) {
            setCountdown(0);
            localStorage.removeItem('mrjk_lockout');
            localStorage.removeItem('mrjk_attempts');
          } else {
            setCountdown(remaining);
          }
        } else {
          setCountdown(0);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [countdown]);

  const checkLockout = () => {
    const lockout = localStorage.getItem('mrjk_lockout');
    if (lockout) {
      const remaining = Math.ceil((parseInt(lockout) - Date.now()) / 1000);
      if (remaining > 0) {
        setCountdown(remaining);
      }
    }
  };

  const handleViewer = () => {
    toast.info('Welcome, friend! 👋');
    onClose();
    navigate('/home');
  };

  const handleLogin = async () => {
    if (countdown > 0) return;
    if (!key) {
      setError('Enter your key');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const valid = await verifyAdminKey(key);
      if (valid) {
        setAdmin(true);
        toast.success('Welcome back, MR!JK! 🔓');
        onClose();
        navigate('/admin/home');
      } else {
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setError('Wrong key. Try again.');
        setKey('');
        checkLockout();
      }
    } catch (err) {
      setError(err.message);
      checkLockout();
    }
    setLoading(false);
  };

  return (
    <GlassModal isOpen={isOpen} onClose={onClose} maxWidth="420px">
      {step === 1 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="text-5xl mb-4">🤔</div>
          <h2 className="font-display text-2xl font-bold mb-2">WHO ARE U?</h2>
          <p className="text-sm opacity-60 mb-8 font-body">Tell us who you are</p>

          <div className="space-y-3">
            <GlassButton
              variant="glass"
              onClick={handleViewer}
              className="w-full flex items-center justify-center gap-3 py-4 text-lg"
            >
              <User size={20} />
              👀 Just a Viewer
            </GlassButton>
            <GlassButton
              onClick={() => setStep(2)}
              className="w-full flex items-center justify-center gap-3 py-4 text-lg"
            >
              <KeyRound size={20} />
              🔑 MR!JK!
            </GlassButton>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">🔑</div>
            <h2 className="font-display text-xl font-bold">Enter Admin Key</h2>
          </div>

          <motion.div animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}} transition={{ duration: 0.4 }}>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={key}
                onChange={(e) => { setKey(e.target.value); setError(''); }}
                placeholder="Enter admin key"
                className="glass-input pr-12 font-mono"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                disabled={countdown > 0}
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 opacity-50 hover:opacity-100"
              >
                {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </motion.div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-400 text-sm mt-3 text-center"
            >
              {error}
            </motion.p>
          )}

          {countdown > 0 && (
            <div className="text-center mt-3">
              <span className="text-xs font-mono glass-pill">
                <Lock size={12} /> Locked: {countdown}s
              </span>
            </div>
          )}

          <GlassButton
            onClick={handleLogin}
            disabled={loading || countdown > 0}
            className="w-full mt-6 flex items-center justify-center gap-2 py-3"
          >
            {loading ? (
              <div className="loader-ring" style={{ width: 20, height: 20, borderWidth: 2 }} />
            ) : (
              <>
                <Unlock size={18} />
                Unlock
              </>
            )}
          </GlassButton>

          <button
            onClick={() => setStep(1)}
            className="w-full text-center text-sm opacity-50 hover:opacity-100 mt-4 transition-opacity"
          >
            ← Back
          </button>
        </motion.div>
      )}
    </GlassModal>
  );
}
