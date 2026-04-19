import { motion } from 'framer-motion';

export default function PageLoader() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{
        background: 'rgba(10, 14, 26, 0.95)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div className="relative flex items-center justify-center mb-6">
        <span className="font-display text-3xl font-bold gradient-text">M</span>
        <div className="absolute">
          <div className="loader-ring" />
        </div>
      </div>
      <motion.p
        className="text-sm font-body text-gray-400"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        Loading...
      </motion.p>
    </motion.div>
  );
}
