import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { glassStyle } from '../../utils/glassStyle';

export default function GlassModal({ isOpen, onClose, children, title, maxWidth = '500px' }) {
  const isMobile = useIsMobile();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={isMobile ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{
              background: 'rgba(0,0,0,0.56)',
              backdropFilter: isMobile ? 'none' : 'blur(24px)',
            }}
          />

          {/* Modal */}
          <motion.div
            initial={isMobile ? false : { scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={isMobile ? { opacity: 0 } : { scale: 0.92, opacity: 0 }}
            transition={isMobile ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 25 }}
            className="relative w-full overflow-y-auto"
            style={{
              maxWidth,
              maxHeight: '90vh',
              padding: '1px',
              borderRadius: '24px',
              background: 'linear-gradient(135deg, rgba(167,139,250,0.55), rgba(6,182,212,0.28), rgba(255,255,255,0.12))',
              boxShadow: '0 24px 80px rgba(2,6,23,0.4)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div
              className="liquid-glass glass-card"
              style={{
                ...glassStyle(isMobile),
                minHeight: '100%',
                borderRadius: '23px',
                padding: '28px',
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                {title && (
                  <h2 className="font-display text-xl font-bold">{title}</h2>
                )}
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors ml-auto"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
