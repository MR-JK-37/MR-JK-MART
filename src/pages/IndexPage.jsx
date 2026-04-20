import { useEffect } from 'react';
import { motion } from 'framer-motion';
import useAppStore from '../store/useAppStore';
import AppGrid from '../components/apps/AppGrid';
import SplashPage from './SplashPage';

export default function IndexPage() {
  const apps = useAppStore(s => s.apps);
  const fetchApps = useAppStore(s => s.fetchApps);
  const loading = useAppStore(s => s.loading);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  const publishedApps = apps.filter(a => a.published !== false);
  const recentApps = publishedApps.slice(0, 4);

  return (
    <SplashPage>
      {/* HomePage Content - Starts immediately below */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 bg-transparent relative z-10">
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
    </SplashPage>
  );
}
