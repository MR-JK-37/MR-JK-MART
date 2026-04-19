import { motion } from 'framer-motion';

export default function GlassButton({ children, onClick, variant = 'gradient', className = '', disabled = false, type = 'button', ...props }) {
  const baseClass = variant === 'gradient' ? 'btn-gradient' : 'btn-glass';
  
  return (
    <motion.button
      type={type}
      whileHover={{ scale: 1.02 }}
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
