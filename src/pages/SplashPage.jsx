import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, 
         AnimatePresence } from 'framer-motion';

export default function SplashPage({ children }) {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const { scrollY } = useScroll();
  
  // Parallax transforms
  const welcomeY = useTransform(scrollY, [0, 600], [0, -60]);
  const titleY   = useTransform(scrollY, [0, 600], [0, -120]);
  const taglineY = useTransform(scrollY, [0, 600], [0, -180]);
  const bgY      = useTransform(scrollY, [0, 600], [0, -30]);
  const opacity  = useTransform(scrollY, [0, 400], [1, 0]);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const titleLetters = 'MR!JK! - MART'.split('');

  return (
    <div style={{ position: 'relative' }}>
      {/* Splash section */}
      <div
        ref={containerRef}
        style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          background: '#0a0a0a',
        }}
      >
        {/* Animated background */}
        <motion.div style={{ y: bgY, position: 'absolute', inset: 0 }}>
          {/* Orb 1 */}
          <div style={{
            position: 'absolute',
            width: '500px', height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(124,58,237,0.3) 0%, transparent 70%)',
            top: '-100px', left: '-100px',
            animation: 'float1 8s ease-in-out infinite',
            filter: 'blur(40px)',
          }} />
          {/* Orb 2 */}
          <div style={{
            position: 'absolute',
            width: '400px', height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(6,182,212,0.25) 0%, transparent 70%)',
            bottom: '-50px', right: '-50px',
            animation: 'float2 10s ease-in-out infinite',
            filter: 'blur(40px)',
          }} />
          {/* Orb 3 */}
          <div style={{
            position: 'absolute',
            width: '300px', height: '300px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(168,85,247,0.2) 0%, transparent 70%)',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            animation: 'float3 12s ease-in-out infinite',
            filter: 'blur(60px)',
          }} />
        </motion.div>

        {/* Grid overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.02) 1px, 
              transparent 1px),
            linear-gradient(90deg, 
              rgba(255,255,255,0.02) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          pointerEvents: 'none',
        }} />

        {/* Content */}
        <div style={{ 
          position: 'relative', 
          zIndex: 2,
          textAlign: 'center',
          padding: '0 20px',
          width: '100%',
        }}>
          {/* WELCOME TO */}
          <motion.p
            style={{
              fontSize: 'clamp(11px, 2vw, 14px)',
              letterSpacing: '0.4em',
              color: 'rgba(167,139,250,0.8)',
              textTransform: 'uppercase',
              marginBottom: '16px',
              fontFamily: 'DM Sans, sans-serif',
              y: welcomeY,
              opacity,
            }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            WELCOME TO
          </motion.p>

          {/* Main title — letter by letter */}
          <motion.div
            style={{ 
              y: titleY,
              display: 'flex',
              flexWrap: 'nowrap',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 'clamp(1px, 0.5vw, 6px)',
              marginBottom: '20px',
              overflow: 'hidden',
              width: '100%',
            }}
          >
            {titleLetters.map((letter, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 60, scale: 0.5 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  delay: 0.4 + i * 0.06,
                  duration: 0.5,
                  type: 'spring',
                  stiffness: 200,
                }}
                style={{
                  fontSize: 'clamp(28px, 7vw, 88px)',
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: '800',
                  background: letter === ' '
                    ? 'transparent'
                    : 'linear-gradient(135deg, #a78bfa, #06b6d4)',
                  WebkitBackgroundClip: letter === ' '
                    ? 'unset' : 'text',
                  WebkitTextFillColor: letter === ' '
                    ? 'transparent' : 'transparent',
                  backgroundClip: 'text',
                  display: 'inline-block',
                  lineHeight: 1,
                  minWidth: letter === ' ' 
                    ? 'clamp(8px, 2vw, 24px)' : 'auto',
                }}
              >
                {letter === ' ' ? '\u00A0' : letter}
              </motion.span>
            ))}
          </motion.div>

          {/* Tagline */}
          <motion.p
            style={{
              fontSize: 'clamp(13px, 2.5vw, 18px)',
              color: 'rgba(255,255,255,0.5)',
              fontFamily: 'DM Sans, sans-serif',
              marginBottom: '48px',
              y: taglineY,
              opacity,
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.8 }}
          >
            Your personal app universe ✨
          </motion.p>

          {/* Enter button */}
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.5, duration: 0.5 }}
            onClick={() => {
              document.getElementById('home-section')
                ?.scrollIntoView({ behavior: 'smooth' });
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            style={{
              padding: 'clamp(10px,2vw,14px) clamp(24px,4vw,40px)',
              background: 
                'linear-gradient(135deg, #7c3aed, #06b6d4)',
              border: 'none',
              borderRadius: '999px',
              color: 'white',
              fontSize: 'clamp(13px, 2vw, 16px)',
              fontFamily: 'DM Sans, sans-serif',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 0 30px rgba(124,58,237,0.4)',
            }}
          >
            Enter →
          </motion.button>
        </div>

        {/* Scroll indicator */}
        <motion.div
          style={{ 
            position: 'absolute', 
            bottom: '32px',
            opacity,
          }}
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <div style={{
            width: '28px', height: '44px',
            border: '2px solid rgba(255,255,255,0.2)',
            borderRadius: '14px',
            display: 'flex',
            justifyContent: 'center',
            paddingTop: '6px',
            margin: '0 auto',
          }}>
            <div style={{
              width: '4px', height: '8px',
              background: 'rgba(167,139,250,0.8)',
              borderRadius: '2px',
              animation: 'scrollDot 2s ease-in-out infinite',
            }} />
          </div>
        </motion.div>
      </div>

      {/* Add CSS animations */}
      <style>{`
        @keyframes float1 {
          0%, 100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(30px,-20px) scale(1.1); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(-20px,30px) scale(0.9); }
        }
        @keyframes float3 {
          0%, 100% { transform: translate(-50%,-50%) scale(1); }
          50% { transform: translate(-50%,-50%) scale(1.2); }
        }
        @keyframes scrollDot {
          0% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(12px); }
        }
      `}</style>

      {/* Home section below splash */}
      <div id="home-section">
        {children}
      </div>
    </div>
  );
}
