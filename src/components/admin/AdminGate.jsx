import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Unlock, Lock, User, KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GlassModal from '../ui/GlassModal';
import GlassButton from '../ui/GlassButton';
import useAppStore from '../../store/useAppStore';
import useToastStore from '../../store/useToastStore';
import { getAdminKey, saveAdminKey } from '../../db/database';
import { hashPassword, verifyPassword } from '../../crypto/adminAuth';

export default function AdminGate({ isOpen, onClose }) {
  const [step, setStep] = useState(1); // 1 = identity, 2 = key entry
  const [isSetup, setIsSetup] = useState(false);
  const [key, setKey] = useState('');
  const [confirmKey, setConfirmKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockUntil, setLockUntil] = useState(0);
  const [countdown, setCountdown] = useState(0);

  const navigate = useNavigate();
  const setAdmin = useAppStore(s => s.setAdmin);
  const toast = useToastStore();

  useEffect(() => {
    if (isOpen) {
      checkSetup();
      loadRateLimit();
      setStep(1);
      setKey('');
      setConfirmKey('');
      setError('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (lockUntil > Date.now()) {
      const interval = setInterval(() => {
        const remaining = Math.ceil((lockUntil - Date.now()) / 1000);
        if (remaining <= 0) {
          setCountdown(0);
          setLockUntil(0);
          clearInterval(interval);
        } else {
          setCountdown(remaining);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [lockUntil]);

  const checkSetup = async () => {
    const auth = await getAdminKey();
    setIsSetup(!auth);
  };

  const loadRateLimit = () => {
    const stored = localStorage.getItem('mrjk-login-attempts');
    if (stored) {
      const data = JSON.parse(stored);
      setAttempts(data.attempts || 0);
      if (data.lockUntil && data.lockUntil > Date.now()) {
        setLockUntil(data.lockUntil);
      }
    }
  };

  const saveRateLimit = (att, lock) => {
    localStorage.setItem('mrjk-login-attempts', JSON.stringify({ attempts: att, lockUntil: lock }));
  };

  const handleViewer = () => {
    toast.info('Welcome, friend! 👋');
    onClose();
    navigate('/home');
  };

  const handleSetup = async () => {
    if (!key || key.length < 4) {
      setError('Key must be at least 4 characters');
      return;
    }
    if (key !== confirmKey) {
      setError('Keys do not match');
      return;
    }
    setLoading(true);
    try {
      const { salt, hash } = await hashPassword(key);
      await saveAdminKey(salt, hash);
      setAdmin(true);
      toast.success('Admin key set! Welcome, MR!JK! 🔓');
      onClose();
      navigate('/admin/home');
    } catch (err) {
      setError('Failed to set up key');
    }
    setLoading(false);
  };

  const handleLogin = async () => {
    if (lockUntil > Date.now()) return;
    if (!key) {
      setError('Enter your key');
      return;
    }
    setLoading(true);
    try {
      const auth = await getAdminKey();
      const valid = await verifyPassword(key, auth.salt, auth.hash);
      if (valid) {
        setAdmin(true);
        setAttempts(0);
        saveRateLimit(0, 0);
        toast.success('Welcome back, MR!JK! 🔓');
        onClose();
        navigate('/admin/home');
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setShake(true);
        setTimeout(() => setShake(false), 500);
        
        if (newAttempts >= 3) {
          const lock = Date.now() + 30000;
          setLockUntil(lock);
          saveRateLimit(newAttempts, lock);
          setError(`Too many attempts. Locked for 30 seconds.`);
        } else {
          saveRateLimit(newAttempts, 0);
          setError(`Invalid key (${3 - newAttempts} attempts left)`);
        }
      }
    } catch (err) {
      setError('Authentication error');
    }
    setLoading(false);
  };

  return (
    <GlassModal isOpen={isOpen} onClose={onClose} maxWidth="420px">
      {step === 1 ? (
        /* Step 1: Identity */
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
        /* Step 2: Key Entry */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">{isSetup ? '🔐' : '🔑'}</div>
            <h2 className="font-display text-xl font-bold">
              {isSetup ? 'Set up your admin key' : 'Enter your key'}
            </h2>
          </div>

          <motion.div animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}} transition={{ duration: 0.4 }}>
            <div className="space-y-4">
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={key}
                  onChange={(e) => { setKey(e.target.value); setError(''); }}
                  placeholder={isSetup ? 'Create admin key' : 'Enter admin key'}
                  className="glass-input pr-12 font-mono"
                  onKeyDown={(e) => e.key === 'Enter' && (isSetup ? handleSetup() : handleLogin())}
                  disabled={lockUntil > Date.now()}
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 opacity-50 hover:opacity-100"
                >
                  {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {isSetup && (
                <input
                  type={showKey ? 'text' : 'password'}
                  value={confirmKey}
                  onChange={(e) => { setConfirmKey(e.target.value); setError(''); }}
                  placeholder="Confirm admin key"
                  className="glass-input font-mono"
                  onKeyDown={(e) => e.key === 'Enter' && handleSetup()}
                />
              )}
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
            onClick={isSetup ? handleSetup : handleLogin}
            disabled={loading || lockUntil > Date.now()}
            className="w-full mt-6 flex items-center justify-center gap-2 py-3"
          >
            {loading ? (
              <div className="loader-ring" style={{ width: 20, height: 20, borderWidth: 2 }} />
            ) : (
              <>
                <Unlock size={18} />
                {isSetup ? 'Set Key & Enter' : 'Unlock'}
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
