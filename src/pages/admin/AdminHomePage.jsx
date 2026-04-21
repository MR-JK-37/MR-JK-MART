import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { getAllApps, getAllContacts, deleteApp, getSiteStats } from '../../firebase/appService';
import useToastStore from '../../store/useToastStore';
import AppGrid from '../../components/apps/AppGrid';
import AddEditAppModal from '../../components/admin/AddEditAppModal';

export default function AdminHomePage() {
  const [apps, setApps] = useState([]);
  const [editingApp, setEditingApp] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [stats, setStats] = useState({
    totalApps: 0,
    totalDownloads: 0,
    totalViews: 0,
    totalSiteViews: 0,
    unreadContacts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const toast = useToastStore();

  const loadData = async () => {
    try {
      setLoading(true);
      const [allApps, allContacts, siteStats] = await Promise.all([
        getAllApps(),
        getAllContacts(),
        getSiteStats(),
      ]);

      const appsList = allApps || [];
      setApps(appsList);
      const unreadContacts = allContacts.filter(c => !c.read).length;
      setStats({
        totalApps: appsList.length,
        totalDownloads: appsList.reduce((sum, app) => sum + (app.downloadCount || 0), 0),
        totalViews: appsList.reduce((sum, app) => sum + (app.viewCount || 0), 0),
        totalSiteViews: siteStats.totalViews || 0,
        unreadContacts,
      });
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
      toast.success(`"${appName}" deleted`);
      await loadData(); // refresh list
    } catch (err) {
      toast.error('Delete failed: ' + err.message);
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

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '12px',
        marginBottom: '32px',
      }}>
        {[
          { label: 'Total Apps', value: stats.totalApps, icon: '📦', color: '#7c3aed' },
          { label: 'Downloads', value: stats.totalDownloads, icon: '⬇️', color: '#06b6d4' },
          { label: 'App Views', value: stats.totalViews, icon: '👁️', color: '#8b5cf6' },
          { label: 'Site Visits', value: stats.totalSiteViews, icon: '🌐', color: '#10b981' },
          {
            label: 'Messages',
            value: stats.unreadContacts,
            icon: '📬',
            color: '#f59e0b',
            badge: stats.unreadContacts > 0,
            onClick: () => navigate('/admin/contacts'),
          },
        ].map((stat) => (
          <button
            key={stat.label}
            type="button"
            onClick={stat.onClick}
            style={{
              padding: '16px 20px',
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${stat.color}30`,
              borderRadius: '16px',
              backdropFilter: 'blur(12px)',
              position: 'relative',
              overflow: 'hidden',
              textAlign: 'left',
              cursor: stat.onClick ? 'pointer' : 'default',
            }}
          >
            <div style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: `${stat.color}20`,
              filter: 'blur(20px)',
            }} />
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>{stat.icon}</div>
            <div style={{
              fontSize: 'clamp(20px, 3vw, 28px)',
              fontWeight: 700,
              color: 'white',
              fontFamily: 'Syne, sans-serif',
              lineHeight: 1,
              marginBottom: '4px',
            }}>
              {stat.value.toLocaleString()}
            </div>
            <div style={{
              fontSize: '12px',
              color: 'rgba(255,255,255,0.5)',
              fontFamily: 'DM Sans, sans-serif',
            }}>
              {stat.label}
            </div>
            {stat.badge && (
              <div style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#f59e0b',
                boxShadow: '0 0 8px #f59e0b',
              }} />
            )}
          </button>
        ))}
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
