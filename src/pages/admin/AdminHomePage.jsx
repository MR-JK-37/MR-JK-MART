import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, AppWindow, Download, MessageCircle, Mail } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import { getAllApps, getAllContacts, deleteApp } from '../../firebase/appService';
import useToastStore from '../../store/useToastStore';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import AppGrid from '../../components/apps/AppGrid';
import AddEditAppModal from '../../components/admin/AddEditAppModal';
import GlassCard from '../../components/ui/GlassCard';

export default function AdminHomePage() {
  const [apps, setApps] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [editingApp, setEditingApp] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [stats, setStats] = useState({ apps: 0, downloads: 0, comments: 0, contacts: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const showToast = useToastStore(s => s.show) || ((type, msg) => alert(msg));

  const loadData = async () => {
    try {
      setLoading(true);
      const [allApps, allContacts, commentsSnap] = await Promise.all([
        getAllApps(),
        getAllContacts(),
        getDocs(collection(db, 'comments'))
      ]);
      
      const appsList = allApps || [];
      setApps(appsList);
      setContacts(allContacts || []);
      
      const totalDownloads = appsList.reduce((sum, app) => sum + (app.downloadCount || 0), 0);
      const unreadContacts = allContacts.filter(c => !c.read).length;
      setStats({ apps: appsList.length, downloads: totalDownloads, comments: commentsSnap.size, contacts: unreadContacts });
    } catch (err) {
      console.error('AdminHomePage load error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEditApp = (app) => {
    setEditingApp(app);
    setShowModal(true);
  };

  const handleAddNew = () => {
    setEditingApp(null);
    setShowModal(true);
  };

  const handleDeleteApp = async (appId, appName) => {
    const confirmed = window.confirm(
      `Delete "${appName}"? This cannot be undone.`
    );
    if (!confirmed) return;
    
    try {
      await deleteApp(appId);
      showToast('success', `"${appName}" deleted`);
      await loadData(); // refresh list
    } catch (err) {
      showToast('error', 'Delete failed: ' + err.message);
      console.error('Delete error:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8">
          <p className="text-red-400 text-xl mb-4">Failed to load: {error}</p>
          <button 
            onClick={loadData}
            className="px-6 py-3 bg-violet-600 rounded-xl text-white hover:bg-violet-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

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
      <AppGrid 
        apps={apps} 
        title="📦 All Apps (including drafts)" 
        onEdit={handleEditApp}
        onDelete={handleDeleteApp}
      />

      {/* FAB */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleAddNew}
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full gradient-bg flex items-center justify-center text-white shadow-lg z-50"
        style={{ boxShadow: '0 8px 24px rgba(124,58,237,0.4)' }}
      >
        <Plus size={28} />
      </motion.button>

      {/* Add App Modal */}
      <AddEditAppModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingApp(null);
        }}
        editingApp={editingApp}
        onRefresh={loadData}
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
