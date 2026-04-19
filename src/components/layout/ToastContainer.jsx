import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import useToastStore from '../../store/useToastStore';

const icons = {
  success: <CheckCircle size={18} />,
  error: <XCircle size={18} />,
  info: <Info size={18} />,
};

const colors = {
  success: 'rgba(34, 197, 94, 0.15)',
  error: 'rgba(239, 68, 68, 0.15)',
  info: 'rgba(124, 58, 237, 0.15)',
};

const borderColors = {
  success: 'rgba(34, 197, 94, 0.3)',
  error: 'rgba(239, 68, 68, 0.3)',
  info: 'rgba(124, 58, 237, 0.3)',
};

const textColors = {
  success: '#4ade80',
  error: '#f87171',
  info: '#a78bfa',
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed top-24 right-4 z-[9998] flex flex-col gap-3 max-w-sm">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl backdrop-blur-xl"
            style={{
              background: colors[toast.type],
              border: `1px solid ${borderColors[toast.type]}`,
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            }}
          >
            <span style={{ color: textColors[toast.type] }}>{icons[toast.type]}</span>
            <p className="text-sm font-body flex-1" style={{ color: textColors[toast.type] }}>
              {toast.message}
            </p>
            <button onClick={() => removeToast(toast.id)} className="opacity-60 hover:opacity-100 transition-opacity">
              <X size={14} style={{ color: textColors[toast.type] }} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
