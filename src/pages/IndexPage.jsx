import { useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import AppGrid from '../components/apps/AppGrid';

export default function IndexPage() {
  const apps = useAppStore(s => s.apps);
  const fetchApps = useAppStore(s => s.fetchApps);
  const loading = useAppStore(s => s.loading);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  const publishedApps = apps.filter(a => a.published !== false);
  const recentApps = publishedApps.slice(0, 4);

  const { scrollY } = useScroll(); // use scrollY for parallax against window scroll

  // Each layer moves at different speed
  const y1 = useTransform(scrollY, [0, typeof window !== 'undefined' ? window.innerHeight : 1000], [0, -80]);   // slowest - bg text
  const y2 = useTransform(scrollY, [0, typeof window !== 'undefined' ? window.innerHeight : 1000], [0, -160]);  // medium - main title
  const y3 = useTransform(scrollY, [0, typeof window !== 'undefined' ? window.innerHeight : 1000], [0, -260]);  // fastest - tagline
  const opacity = useTransform(scrollY, [0, typeof window !== 'undefined' ? window.innerHeight * 0.7 : 700], [1, 0]);

  const titleText = "MR!JK! - MART";

  return (
    <div className="w-full">
      {/* Layered Splash Page (100vh) */}
      <div style={{ height: '100vh', overflow: 'hidden', position: 'relative' }}>
        
        {/* Layer 0 - Decorative gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-30"
            style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.4) 0%, transparent 70%)', filter: 'blur(60px)' }} />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.4) 0%, transparent 70%)', filter: 'blur(60px)' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.3) 0%, transparent 60%)', filter: 'blur(80px)' }} />
        </div>

        {/* Layer 1 - Background subtitle - slowest */}
        <motion.div style={{ y: y1, opacity }} className="absolute inset-0 flex items-center justify-center pointer-events-none pb-24 md:pb-32">
          <p className="text-sm md:text-base font-body tracking-[0.3em] uppercase opacity-50">
            Welcome to
          </p>
        </motion.div>

        {/* Layer 2 - Main hero title - medium speed */}
        <motion.div style={{ y: y2, opacity }} className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <h1
            className="font-display font-extrabold text-center leading-none"
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
          </h1>
        </motion.div>

        {/* Layer 3 - Tagline + scroll indicator - fastest */}
        <motion.div style={{ y: y3, opacity }} className="absolute inset-0 flex items-end justify-center pointer-events-none">
          <div className="mb-32 md:mb-40 flex flex-col items-center">
            <p className="text-lg md:text-xl font-body opacity-60 text-center px-4 mb-16 pointer-events-auto">
              Your personal app universe
            </p>
            
            <button
              onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
              className="flex flex-col items-center gap-2 group z-10 pointer-events-auto"
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
            </button>
          </div>
        </motion.div>
      </div>

      {/* HomePage Content - Starts immediately below */}
      <div id="home-section" className="max-w-7xl mx-auto px-4 md:px-8 py-16 bg-transparent relative z-10">
        {/* Header */}
        <div className="mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-4xl md:text-5xl font-bold mb-3"
          >
            Discover <span className="gradient-text">Apps</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg opacity-60 font-body"
          >
            Browse and download premium applications by MR!JK!
          </motion.p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="loader-ring" />
          </div>
        ) : (
          <>
            {/* Recently Added */}
            {recentApps.length > 0 && (
              <AppGrid apps={recentApps} title="✨ Recently Added" />
            )}

            {/* All Apps */}
            <AppGrid apps={publishedApps} title="📦 All Apps" />
          </>
        )}
      </div>
    </div>
  );
}
