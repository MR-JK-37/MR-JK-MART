import { motion } from 'framer-motion';
import { useIsMobile } from '../../hooks/useIsMobile';

export default function GlassButton({ children, onClick, variant = 'gradient', className = '', disabled = false, type = 'button', ...props }) {
  const baseClass = variant === 'gradient' ? 'btn-gradient' : 'btn-glass';
  const isMobile = useIsMobile();
  
  return (
    <motion.button
      type={type}
      whileHover={isMobile ? undefined : { scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClass} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}
