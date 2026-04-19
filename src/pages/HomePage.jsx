import { useEffect } from 'react';
import { motion } from 'framer-motion';
import useAppStore from '../store/useAppStore';
import AppGrid from '../components/apps/AppGrid';

export default function HomePage() {
  const { apps, fetchApps, loading } = useAppStore();

  useEffect(() => {
    fetchApps();
  }, []);

  const publishedApps = apps.filter(a => a.published !== false);
  const recentApps = publishedApps.slice(0, 4);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-7xl mx-auto px-4 md:px-8 pt-28 pb-16"
    >
      {/* Header */}
      <div className="mb-12">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-4xl md:text-5xl font-bold mb-3"
        >
          Discover <span className="gradient-text">Apps</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
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
    </motion.div>
  );
}
