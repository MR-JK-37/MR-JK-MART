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
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.12, duration: 0.75 }}
            className="liquid-glass splash-hero-card"
            style={{
              maxWidth: 'min(92vw, 920px)',
              margin: '0 auto',
              padding: 'clamp(26px, 5vw, 46px)',
              borderRadius: '36px',
              boxShadow: '0 34px 100px rgba(4, 10, 30, 0.3)',
              background:
                'linear-gradient(145deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.05) 42%, rgba(9,18,38,0.22) 100%)',
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

          <motion.h1
            style={{
              y: titleY,
              margin: '0 auto 30px',
              width: 'min(92vw, 760px)',
              lineHeight: 0.88,
            }}
          >
            <motion.span
              initial={{ opacity: 0, y: 48, letterSpacing: '0.1em' }}
              animate={{ opacity: 1, y: 0, letterSpacing: '-0.06em' }}
              transition={{ delay: 0.34, duration: 0.65, ease: 'easeOut' }}
              style={{
                display: 'block',
                fontFamily: 'Syne, sans-serif',
                fontWeight: 800,
                fontSize: 'clamp(2.9rem, 10vw, 8rem)',
                letterSpacing: '-0.06em',
                textTransform: 'uppercase',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, #d8b4fe 24%, #8b9bff 58%, #67e8f9 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 0 30px rgba(122, 92, 255, 0.16)',
              }}
            >
              MR!JK!
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.54, duration: 0.6, ease: 'easeOut' }}
              style={{
                display: 'block',
                marginTop: '0.1em',
                fontFamily: 'Syne, sans-serif',
                fontWeight: 700,
                fontSize: 'clamp(2.4rem, 8.2vw, 6.1rem)',
                letterSpacing: '-0.05em',
                textTransform: 'uppercase',
                color: 'rgba(241,245,249,0.96)',
                textShadow: '0 12px 42px rgba(6, 182, 212, 0.12)',
              }}
            >
              MART
            </motion.span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="flex items-center justify-center gap-3 mb-10"
            style={{ flexWrap: 'wrap' }}
          >
            {['Premium App Store', 'Fast Downloads'].map((item) => (
              <span
                key={item}
                style={{
                  fontSize: 'clamp(11px, 1.6vw, 13px)',
                  padding: '10px 16px',
                  borderRadius: '999px',
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(255,255,255,0.06)',
                  color: 'rgba(226,232,240,0.76)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  backdropFilter: 'blur(20px)',
                }}
              >
                {item}
              </span>
            ))}
          </motion.div>

          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.15, duration: 0.5 }}
            onClick={() => {
              document.getElementById('home-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="btn-gradient"
            style={{
              y: taglineY,
              opacity,
              padding: 'clamp(12px, 2vw, 16px) clamp(28px, 4vw, 44px)',
              borderRadius: '999px',
              fontSize: 'clamp(13px, 2vw, 16px)',
              boxShadow: '0 0 36px rgba(124,58,237,0.32)',
            }}
          >
            Enter
          </motion.button>
          </motion.div>
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
