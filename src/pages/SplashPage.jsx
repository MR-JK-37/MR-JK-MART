import { useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export default function SplashPage({ children }) {
  const containerRef = useRef(null);
  const { scrollY } = useScroll();

  const welcomeY = useTransform(scrollY, [0, 600], [0, -60]);
  const titleY = useTransform(scrollY, [0, 600], [0, -120]);
  const taglineY = useTransform(scrollY, [0, 600], [0, -180]);
  const bgY = useTransform(scrollY, [0, 600], [0, -30]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const titleLetters = 'MR!JK! - MART'.split('');

  return (
    <div style={{ position: 'relative' }}>
      <section
        ref={containerRef}
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          padding: '120px 0 64px',
        }}
      >
        <motion.div style={{ y: bgY }} className="abs-fill">
          <div
            style={{
              position: 'absolute',
              width: 'min(50vw, 500px)',
              height: 'min(50vw, 500px)',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(124,58,237,0.3) 0%, transparent 70%)',
              top: '-100px',
              left: '-100px',
              animation: 'float1 8s ease-in-out infinite',
              filter: 'blur(40px)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: 'min(44vw, 420px)',
              height: 'min(44vw, 420px)',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(6,182,212,0.25) 0%, transparent 70%)',
              bottom: '-60px',
              right: '-60px',
              animation: 'float2 10s ease-in-out infinite',
              filter: 'blur(40px)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: 'min(34vw, 320px)',
              height: 'min(34vw, 320px)',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(236,72,153,0.18) 0%, transparent 70%)',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              animation: 'float3 12s ease-in-out infinite',
              filter: 'blur(60px)',
            }}
          />
        </motion.div>

        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
            maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.85), rgba(0,0,0,0.45))',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at top, rgba(255,255,255,0.08), transparent 28%), linear-gradient(180deg, rgba(10,14,26,0.12), rgba(10,14,26,0.75))',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            position: 'relative',
            zIndex: 2,
            textAlign: 'center',
            padding: '0 20px',
            width: '100%',
            maxWidth: '1120px',
            margin: '0 auto',
          }}
        >
          <motion.p
            style={{
              y: welcomeY,
              opacity,
              fontSize: 'clamp(11px, 2vw, 14px)',
              letterSpacing: '0.38em',
              color: 'rgba(167,139,250,0.82)',
              textTransform: 'uppercase',
              marginBottom: '16px',
              fontFamily: 'DM Sans, sans-serif',
            }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            Welcome To
          </motion.p>

          <motion.div
            style={{
              y: titleY,
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 'clamp(1px, 0.45vw, 6px)',
              margin: '0 auto 20px',
              width: 'min(92vw, 980px)',
              overflow: 'hidden',
            }}
          >
            {titleLetters.map((letter, index) => (
              <motion.span
                key={`${letter}-${index}`}
                initial={{ opacity: 0, y: 60, scale: 0.5 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  delay: 0.4 + index * 0.05,
                  duration: 0.5,
                  type: 'spring',
                  stiffness: 220,
                }}
                style={{
                  fontSize: 'clamp(24px, 8vw, 88px)',
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 800,
                  lineHeight: 0.95,
                  display: 'inline-block',
                  padding: '0.04em 0',
                  background:
                    letter === ' '
                      ? 'transparent'
                      : 'linear-gradient(135deg, #f5d0fe 0%, #a78bfa 35%, #06b6d4 100%)',
                  WebkitBackgroundClip: letter === ' ' ? 'border-box' : 'text',
                  backgroundClip: letter === ' ' ? 'border-box' : 'text',
                  WebkitTextFillColor: letter === ' ' ? 'transparent' : 'transparent',
                  minWidth: letter === ' ' ? 'clamp(10px, 2vw, 24px)' : 'auto',
                  textShadow: letter === ' ' ? 'none' : '0 0 24px rgba(124,58,237,0.18)',
                }}
              >
                {letter === ' ' ? '\u00A0' : letter}
              </motion.span>
            ))}
          </motion.div>

          <motion.p
            style={{
              y: taglineY,
              opacity,
              fontSize: 'clamp(13px, 2.6vw, 18px)',
              color: 'rgba(255,255,255,0.62)',
              fontFamily: 'DM Sans, sans-serif',
              margin: '0 auto 48px',
              maxWidth: 'min(88vw, 540px)',
              lineHeight: 1.7,
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.8 }}
          >
            Your personal app universe, built for smooth discovery, clean downloads, and a storefront that feels alive on every screen.
          </motion.p>

          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.45, duration: 0.5 }}
            onClick={() => {
              document.getElementById('home-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="btn-gradient"
            style={{
              padding: 'clamp(11px, 2vw, 15px) clamp(24px, 4vw, 40px)',
              borderRadius: '999px',
              fontSize: 'clamp(13px, 2vw, 16px)',
              boxShadow: '0 0 30px rgba(124,58,237,0.42)',
            }}
          >
            Enter
          </motion.button>
        </div>

        <motion.div
          style={{
            position: 'absolute',
            bottom: '32px',
            opacity,
          }}
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <div
            style={{
              width: '28px',
              height: '44px',
              border: '2px solid rgba(255,255,255,0.2)',
              borderRadius: '14px',
              display: 'flex',
              justifyContent: 'center',
              paddingTop: '6px',
              margin: '0 auto',
            }}
          >
            <div
              style={{
                width: '4px',
                height: '8px',
                background: 'rgba(167,139,250,0.85)',
                borderRadius: '2px',
                animation: 'scrollDot 2s ease-in-out infinite',
              }}
            />
          </div>
        </motion.div>
      </section>

      <style>{`
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -20px) scale(1.08); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-22px, 30px) scale(0.94); }
        }
        @keyframes float3 {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.14); }
        }
        @keyframes scrollDot {
          0% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(12px); }
        }
        .abs-fill {
          position: absolute;
          inset: 0;
        }
      `}</style>

      <div id="home-section">
        {children}
      </div>
    </div>
  );
}
