import { motion } from 'framer-motion';
import { useIsMobile } from '../../hooks/useIsMobile';
import { glassStyle } from '../../utils/glassStyle';

export default function GlassCard({ children, className = '', liquid = false, onClick, hover = true, style = {} }) {
  const isMobile = useIsMobile();

  return (
    <motion.div
      className={`${liquid ? 'liquid-glass' : 'glass'} glass-card ${className}`}
      onClick={onClick}
      whileHover={!isMobile && hover ? { y: -8, boxShadow: '0 16px 48px rgba(0,0,0,0.25), 0 0 0 1px rgba(124,58,237,0.2)' } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      transition={isMobile ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 20 }}
      style={{ ...glassStyle(isMobile), cursor: onClick ? 'pointer' : 'default', ...style }}
    >
      {children}
    </motion.div>
  );
}
