import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, MoreVertical, Edit, Trash2 } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import GlassCard from '../ui/GlassCard';

export default function AppCard({ app, index = 0, onEdit, onDelete }) {
  const navigate = useNavigate();
  const isAdmin = useAppStore(s => s.isAdmin);
  const deleteApp = useAppStore(s => s.deleteApp);
  const setPageLoading = useAppStore(s => s.setPageLoading);
  const [showMenu, setShowMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const iconUrl = app.iconUrl || app.icon || '';
  const platforms = (app.platform || []).slice(0, 3);

  const handleClick = () => {
    setPageLoading(true);
    setTimeout(() => {
      navigate(`/app/${app.id}`);
      setPageLoading(false);
    }, 600);
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(app.id, app.name);
    } else if (window.confirm(`Delete "${app.name}"? This cannot be undone.`)) {
      await deleteApp(app.id);
    }
    setShowMenu(false);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(app);
    } else {
      navigate(`/admin/edit-app/${app.id}`);
    }
    setShowMenu(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 200 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setShowMenu(false); }}
      className="app-card relative h-full"
    >
      <GlassCard
        liquid
        onClick={handleClick}
        className="p-5 sm:p-6 flex flex-col text-left relative overflow-hidden gradient-border h-full min-h-[320px] sm:min-h-[360px]"
        style={{
          background: isHovered
            ? 'linear-gradient(180deg, rgba(255,255,255,0.14), rgba(255,255,255,0.06))'
            : undefined,
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: isHovered
              ? 'linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.1) 40%, transparent 75%)'
              : 'transparent',
            transform: isHovered ? 'translateX(0%)' : 'translateX(-140%)',
            transition: 'transform 0.8s ease',
          }}
        />

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

        {/* Draft Badge */}
        {isAdmin && app.published === false && (
          <div className="absolute top-3 left-3 z-10 px-2 py-0.5 rounded-md bg-yellow-500/20 text-yellow-400 text-[10px] font-bold uppercase tracking-wider">
            Draft
          </div>
        )}

        <div className="relative z-[1] flex h-full flex-col">
          <motion.div
            animate={{ scale: isHovered ? 1.05 : 1, rotate: isHovered ? -1.5 : 0 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="w-24 h-24 rounded-[28px] overflow-hidden mb-5 flex items-center justify-center self-center"
            style={{
              background: iconUrl ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #7c3aed, #06b6d4)',
              border: '1px solid rgba(255,255,255,0.14)',
              boxShadow: '0 18px 30px rgba(4, 10, 24, 0.3)',
            }}
          >
            {iconUrl ? (
              <img src={iconUrl} alt={app.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-3xl font-display font-bold">
                {app.name?.charAt(0) || 'A'}
              </span>
            )}
          </motion.div>

          <div className="mb-3 text-center">
            <h3 className="font-display text-xl font-bold line-clamp-1">{app.name}</h3>
            <p className="text-sm opacity-60 font-body mt-2 line-clamp-3 min-h-[60px]">{app.shortDesc}</p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mb-4">
            <span className="glass-pill text-[11px]">v{app.version || '1.0.0'}</span>
            {platforms.map(platform => (
              <span key={platform} className="glass-pill text-[11px] capitalize">
                {platform}
              </span>
            ))}
          </div>

          <div className="app-card-footer mt-auto flex items-center justify-between rounded-2xl px-4 py-3 bg-black/15 border border-white/10">
            <div className="flex items-center gap-2 text-sm opacity-75">
              <Download size={14} className="text-cyan-300" />
              <span>{app.downloadCount || 0} downloads</span>
            </div>
            <motion.span
              initial={{ opacity: 0.7 }}
              animate={{ opacity: isHovered ? 1 : 0.75, x: isHovered ? 4 : 0 }}
              className="text-sm font-medium gradient-text"
            >
              View App
            </motion.span>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
