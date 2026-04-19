import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, X, ArrowRight } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import GlassCard from '../components/ui/GlassCard';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const { apps, fetchApps } = useAppStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchApps();
  }, []);

  // Debounce
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Save recent searches
  useEffect(() => {
    if (debouncedQuery.trim().length > 2) {
      const recent = JSON.parse(localStorage.getItem('mrjk-recent-search') || '[]');
      const updated = [debouncedQuery, ...recent.filter(r => r !== debouncedQuery)].slice(0, 5);
      localStorage.setItem('mrjk-recent-search', JSON.stringify(updated));
    }
  }, [debouncedQuery]);

  const results = useMemo(() => {
    if (!debouncedQuery.trim()) return null;
    const q = debouncedQuery.toLowerCase();
    return apps.filter(app =>
      app.published !== false && (
        app.name?.toLowerCase().includes(q) ||
        app.shortDesc?.toLowerCase().includes(q) ||
        app.category?.toLowerCase().includes(q) ||
        app.platform?.some(p => p.toLowerCase().includes(q))
      )
    );
  }, [debouncedQuery, apps]);

  const recentSearches = JSON.parse(localStorage.getItem('mrjk-recent-search') || '[]');

  const handleAppClick = (id) => {
    navigate(`/app/${id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="max-w-3xl mx-auto px-4 md:px-8 pt-28 pb-16"
    >
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-display text-4xl font-bold mb-8 text-center"
      >
        Search <span className="gradient-text">Apps</span>
      </motion.h1>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative mb-8"
      >
        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="glass-input pl-12 pr-12 py-4 text-lg"
          placeholder="Search apps..."
          autoFocus
          style={{ borderRadius: 20 }}
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10"
          >
            <X size={18} className="opacity-50" />
          </button>
        )}
      </motion.div>

      {/* Results */}
      {results !== null ? (
        results.length > 0 ? (
          <div className="space-y-3">
            {results.map((app, i) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <GlassCard
                  onClick={() => handleAppClick(app.id)}
                  className="p-4 flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center"
                    style={{ background: app.icon ? 'transparent' : 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}>
                    {app.icon ? (
                      <img src={app.icon} alt={app.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-bold">{app.name?.charAt(0)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-bold text-base">{app.name}</h3>
                    <p className="text-sm opacity-50 truncate">{app.shortDesc}</p>
                  </div>
                  <ArrowRight size={18} className="opacity-30 flex-shrink-0" />
                </GlassCard>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-xl opacity-60 font-body mb-2">No apps found</p>
            <p className="text-sm opacity-40">Try a different search term</p>
          </div>
        )
      ) : (
        /* No search yet */
        <div>
          {recentSearches.length > 0 && (
            <div className="mb-8">
              <p className="text-sm opacity-40 mb-3">Recently searched</p>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((term, i) => (
                  <button
                    key={i}
                    onClick={() => setQuery(term)}
                    className="glass-pill hover:border-purple-500/30 transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Show all apps */}
          {apps.filter(a => a.published !== false).length > 0 && (
            <div className="space-y-3">
              <p className="text-sm opacity-40 mb-3">All apps</p>
              {apps.filter(a => a.published !== false).map((app, i) => (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <GlassCard
                    onClick={() => handleAppClick(app.id)}
                    className="p-4 flex items-center gap-4"
                  >
                    <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center"
                      style={{ background: app.icon ? 'transparent' : 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}>
                      {app.icon ? (
                        <img src={app.icon} alt={app.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white font-bold">{app.name?.charAt(0)}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-bold">{app.name}</h3>
                      <p className="text-sm opacity-50 truncate">{app.shortDesc}</p>
                    </div>
                    <ArrowRight size={18} className="opacity-30 flex-shrink-0" />
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
