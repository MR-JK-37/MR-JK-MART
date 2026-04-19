import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, MoreVertical, Edit, Trash2 } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import GlassCard from '../ui/GlassCard';

export default function AppCard({ app, index = 0 }) {
  const navigate = useNavigate();
  const { isAdmin, deleteApp, setPageLoading } = useAppStore();
  const [showMenu, setShowMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    setPageLoading(true);
    setTimeout(() => {
      navigate(`/app/${app.id}`);
      setPageLoading(false);
    }, 600);
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (window.confirm(`Delete "${app.name}"? This cannot be undone.`)) {
      await deleteApp(app.id);
    }
    setShowMenu(false);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    navigate(`/admin/edit-app/${app.id}`);
    setShowMenu(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 200 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setShowMenu(false); }}
      className="relative"
    >
      <GlassCard
        liquid
        onClick={handleClick}
        className="p-6 flex flex-col items-center text-center relative overflow-hidden gradient-border"
      >
        {/* Admin Menu */}
        {isAdmin && (
          <div className="absolute top-3 right-3 z-10">
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
              className="p-1.5 rounded-full glass-pill hover:bg-white/15 transition-colors"
            >
              <MoreVertical size={16} />
            </button>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="absolute right-0 top-full mt-1 glass rounded-xl overflow-hidden min-w-[140px]"
                style={{ padding: 4 }}
              >
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg hover:bg-white/10 transition-colors text-left"
                >
                  <Edit size={14} /> Edit App
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg hover:bg-red-500/20 transition-colors text-left text-red-400"
                >
                  <Trash2 size={14} /> Delete App
                </button>
              </motion.div>
            )}
          </div>
        )}

        {/* App Icon */}
        <motion.div
          animate={{ scale: isHovered ? 1.05 : 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
          className="w-20 h-20 rounded-2xl overflow-hidden mb-4 flex items-center justify-center"
          style={{
            background: app.icon ? 'transparent' : 'linear-gradient(135deg, #7c3aed, #06b6d4)',
          }}
        >
          {app.icon ? (
            <img src={app.icon} alt={app.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-white text-2xl font-display font-bold">
              {app.name?.charAt(0) || 'A'}
            </span>
          )}
        </motion.div>

        {/* App Name */}
        <h3 className="font-display text-lg font-bold mb-1 line-clamp-1">{app.name}</h3>

        {/* Description */}
        <p className="text-sm opacity-60 font-body mb-3 line-clamp-2">{app.shortDesc}</p>

        {/* Version Badge */}
        <span className="glass-pill text-xs mb-2">v{app.version || '1.0.0'}</span>

        {/* Download Count */}
        <div className="flex items-center gap-1 text-xs opacity-40">
          <Download size={12} />
          <span>{app.downloadCount || 0} downloads</span>
        </div>

        {/* Hover Reveal */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          className="absolute bottom-3 left-0 right-0 text-center"
        >
          <span className="text-xs font-medium gradient-text">View App →</span>
        </motion.div>
      </GlassCard>
    </motion.div>
  );
}
