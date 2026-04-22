import { motion } from 'framer-motion';
import useAppStore from '../../store/useAppStore';
import { useIsMobile } from '../../hooks/useIsMobile';

const orbs = [
  { color: 'rgba(124, 58, 237, 0.15)', size: 500, x: '10%', y: '20%', delay: 0 },
  { color: 'rgba(6, 182, 212, 0.12)', size: 400, x: '80%', y: '10%', delay: 2 },
  { color: 'rgba(124, 58, 237, 0.1)', size: 350, x: '70%', y: '70%', delay: 4 },
  { color: 'rgba(6, 182, 212, 0.08)', size: 300, x: '20%', y: '80%', delay: 1 },
  { color: 'rgba(124, 58, 237, 0.06)', size: 450, x: '50%', y: '40%', delay: 3 },
];

const lightOrbs = [
  { color: 'rgba(124, 58, 237, 0.08)', size: 500, x: '10%', y: '20%', delay: 0 },
  { color: 'rgba(6, 182, 212, 0.06)', size: 400, x: '80%', y: '10%', delay: 2 },
  { color: 'rgba(124, 58, 237, 0.05)', size: 350, x: '70%', y: '70%', delay: 4 },
  { color: 'rgba(6, 182, 212, 0.04)', size: 300, x: '20%', y: '80%', delay: 1 },
];

export default function BackgroundOrbs() {
  const theme = useAppStore(s => s.theme);
  const isMobile = useIsMobile();
  const baseOrbs = theme === 'dark' ? orbs : lightOrbs;
  const orbSet = baseOrbs;

  if (isMobile) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {orbSet.map((orb, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            left: orb.x,
            top: orb.y,
            width: isMobile ? Math.min(orb.size, 260) : orb.size,
            height: isMobile ? Math.min(orb.size, 260) : orb.size,
            borderRadius: '50%',
            background: orb.color,
            filter: isMobile ? 'blur(42px)' : 'blur(80px)',
            transform: 'translate(-50%, -50%)',
          }}
          animate={isMobile ? undefined : {
            y: [0, -30, 0, 30, 0],
            x: [0, 20, 0, -20, 0],
            scale: [1, 1.1, 1, 0.95, 1],
          }}
          transition={{
            duration: 12 + i * 2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: orb.delay,
          }}
        />
      ))}
    </div>
  );
}
