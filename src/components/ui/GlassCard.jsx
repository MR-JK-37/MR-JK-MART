import { motion } from 'framer-motion';

export default function GlassCard({ children, className = '', liquid = false, onClick, hover = true, style = {} }) {
  return (
    <motion.div
      className={`${liquid ? 'liquid-glass' : 'glass'} ${className}`}
      onClick={onClick}
      whileHover={hover ? { y: -8, boxShadow: '0 16px 48px rgba(0,0,0,0.25), 0 0 0 1px rgba(124,58,237,0.2)' } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      style={{ cursor: onClick ? 'pointer' : 'default', ...style }}
    >
      {children}
    </motion.div>
  );
}
