import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, AppWindow, Download, MessageCircle, Mail } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import { getAllCommentsCount, getUnreadContactCount } from '../../db/database';
import AppGrid from '../../components/apps/AppGrid';
import AddEditAppModal from '../../components/admin/AddEditAppModal';
import GlassCard from '../../components/ui/GlassCard';

export default function AdminHomePage() {
  const { apps, fetchApps } = useAppStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [stats, setStats] = useState({ apps: 0, downloads: 0, comments: 0, contacts: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      try {
        await fetchApps();
        const commentsCount = await getAllCommentsCount();
        const unreadContacts = await getUnreadContactCount();
        setStats(prev => ({ ...prev, comments: commentsCount, contacts: unreadContacts }));
      } catch (err) {
        console.error('DB Error:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center pt-20">
      <div className="loader-ring" />
    </div>
  );

  useEffect(() => {
    const totalDownloads = apps.reduce((sum, app) => sum + (app.downloadCount || 0), 0);
    setStats(prev => ({ ...prev, apps: apps.length, downloads: totalDownloads }));
  }, [apps]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="max-w-7xl mx-auto px-4 md:px-8 pt-28 pb-16"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold">
            Admin <span className="gradient-text">Dashboard</span>
          </h1>
          <p className="opacity-60 font-body mt-1">Manage your apps and content</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatCard icon={<AppWindow size={22} />} label="Total Apps" value={stats.apps} color="#7c3aed" />
        <StatCard icon={<Download size={22} />} label="Downloads" value={stats.downloads} color="#06b6d4" />
        <StatCard icon={<MessageCircle size={22} />} label="Comments" value={stats.comments} color="#22c55e" />
        <StatCard
          icon={<Mail size={22} />}
          label="Unread Contacts"
          value={stats.contacts}
          color="#f59e0b"
          onClick={() => navigate('/admin/contacts')}
        />
      </div>

      {/* App Grid */}
      <AppGrid apps={apps} title="📦 All Apps (including drafts)" />

      {/* FAB */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full gradient-bg flex items-center justify-center text-white shadow-lg z-50"
        style={{ boxShadow: '0 8px 24px rgba(124,58,237,0.4)' }}
      >
        <Plus size={28} />
      </motion.button>

      {/* Add App Modal */}
      <AddEditAppModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
    </motion.div>
  );
}

function StatCard({ icon, label, value, color, onClick }) {
  return (
    <GlassCard
      liquid
      onClick={onClick}
      hover={!!onClick}
      className="p-5 text-center"
    >
      <div className="flex justify-center mb-3" style={{ color }}>{icon}</div>
      <p className="font-display text-2xl font-bold mb-1">{value}</p>
      <p className="text-xs opacity-50">{label}</p>
    </GlassCard>
  );
}
