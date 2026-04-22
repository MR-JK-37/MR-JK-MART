import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Package,
  Download,
  Eye,
  Globe,
  MessageSquare,
  Plus,
} from 'lucide-react';
import { getAllApps, getAllContacts, deleteApp, getSiteStats } from '../../firebase/appService';
import useToastStore from '../../store/useToastStore';
import AppGrid from '../../components/apps/AppGrid';
import AddEditAppModal from '../../components/admin/AddEditAppModal';
import { useIsMobile } from '../../hooks/useIsMobile';
import { glassStyle } from '../../utils/glassStyle';

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
  const isMobile = useIsMobile();

  const STAT_CARDS = [
    {
      label: 'Total Apps',
      value: stats.totalApps,
      icon: Package,
      color: '#7c3aed',
      bg: 'rgba(124,58,237,0.12)',
    },
    {
      label: 'Downloads',
      value: stats.totalDownloads,
      icon: Download,
      color: '#06b6d4',
      bg: 'rgba(6,182,212,0.12)',
    },
    {
      label: 'App Views',
      value: stats.totalViews,
      icon: Eye,
      color: '#8b5cf6',
      bg: 'rgba(139,92,246,0.12)',
    },
    {
      label: 'Site Visits',
      value: stats.totalSiteViews,
      icon: Globe,
      color: '#10b981',
      bg: 'rgba(16,185,129,0.12)',
    },
    {
      label: 'Messages',
      value: stats.unreadContacts,
      icon: MessageSquare,
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.12)',
      showBadge: stats.unreadContacts > 0,
      onClick: () => navigate('/admin/contacts'),
    },
  ];

  const refreshDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [apps, contacts, siteStats] = await Promise.all([
        getAllApps(),
        getAllContacts(),
        getSiteStats(),
      ]);

      const unread = contacts.filter((contact) => contact.read === false).length;
      setStats({
        totalApps: apps.length,
        totalDownloads: apps.reduce(
          (sum, app) => sum + (Number(app.downloadCount) || 0),
          0
        ),
        totalViews: apps.reduce(
          (sum, app) => sum + (Number(app.viewCount) || 0),
          0
        ),
        totalSiteViews: Number(siteStats?.totalViews) || 0,
        unreadContacts: unread,
      });
      setApps(apps);
    } catch (err) {
      console.error('refreshDashboard error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshDashboard();
  }, [refreshDashboard]);

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
      await refreshDashboard();
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
            onClick={refreshDashboard}
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
      initial={isMobile ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={isMobile ? { duration: 0 } : undefined}
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
        {STAT_CARDS.map(({ label, value, icon: Icon, color, bg, showBadge, onClick }) => (
          <button
            key={label}
            type="button"
            onClick={onClick}
            style={{
              ...glassStyle(isMobile),
              padding: '20px',
              background: bg,
              border: `1px solid ${color}25`,
              borderRadius: '16px',
              position: 'relative',
              overflow: 'hidden',
              transition: isMobile ? 'none' : 'transform 0.2s ease, box-shadow 0.2s ease',
              textAlign: 'left',
              cursor: onClick ? 'pointer' : 'default',
            }}
          >
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: `${color}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px',
            }}>
              <Icon size={20} color={color} strokeWidth={1.5} />
            </div>
            <div style={{
              fontSize: '28px',
              fontWeight: '700',
              color: 'white',
              fontFamily: 'Syne, sans-serif',
              lineHeight: 1,
              marginBottom: '4px',
            }}>
              {value?.toLocaleString() || '0'}
            </div>
            <div style={{
              fontSize: '13px',
              color: 'rgba(255,255,255,0.5)',
              fontFamily: 'DM Sans, sans-serif',
            }}>
              {label}
            </div>
            {showBadge && (
              <div style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: color,
                boxShadow: `0 0 8px ${color}`,
                animation: 'pulse 2s ease-in-out infinite',
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
        whileHover={isMobile ? undefined : { scale: 1.1 }}
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
        onRefresh={refreshDashboard}
      />
    </motion.div>
  );
}
