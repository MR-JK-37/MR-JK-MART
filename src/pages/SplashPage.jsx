import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export default function SplashPage() {
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const titleText = "MR!JK! - MART";

  const handleScroll = () => {
    navigate('/home');
  };

  return (
    <motion.div
      ref={containerRef}
      className="relative h-screen flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Decorative gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.4) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.4) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.3) 0%, transparent 60%)', filter: 'blur(80px)' }} />
      </div>

      {/* Welcome text */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        className="text-sm md:text-base font-body tracking-[0.3em] uppercase opacity-50 mb-4"
      >
        Welcome to
      </motion.p>

      {/* Hero Title */}
      <motion.h1
        className="font-display font-extrabold text-center leading-none mb-6"
        style={{ fontSize: 'clamp(2.5rem, 8vw, 6rem)' }}
      >
        {titleText.split('').map((char, i) => (
          <motion.span
            key={i}
            className={char !== ' ' ? 'gradient-text' : ''}
            initial={{ opacity: 0, y: 50, rotateX: -90 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{
              delay: 0.5 + i * 0.05,
              type: 'spring',
              stiffness: 150,
              damping: 12,
            }}
            style={{ display: 'inline-block' }}
          >
            {char === ' ' ? '\u00A0' : char}
          </motion.span>
        ))}
      </motion.h1>

      {/* Tagline */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        className="text-lg md:text-xl font-body opacity-60 mb-16 text-center px-4"
      >
        Your personal app universe
      </motion.p>

      {/* Scroll indicator */}
      <motion.button
        onClick={handleScroll}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-12 flex flex-col items-center gap-2 group"
      >
        <span className="text-xs font-body opacity-40 group-hover:opacity-80 transition-opacity">
          Enter
        </span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown size={24} className="opacity-40 group-hover:opacity-80" />
        </motion.div>
      </motion.button>
    </motion.div>
  );
}
