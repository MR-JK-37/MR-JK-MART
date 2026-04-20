import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import useAppStore from '../../store/useAppStore';
import AddEditAppModal from '../../components/admin/AddEditAppModal';

export default function AdminAddAppPage() {
  const { appId } = useParams();
  const navigate = useNavigate();
  const getAppById = useAppStore(s => s.getAppById);
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(!!appId);

  useEffect(() => {
    if (appId) {
      loadApp();
    }
  }, [appId]);

  const loadApp = async () => {
    setLoading(true);
    const data = await getAppById(Number(appId));
    setApp(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loader-ring" />
      </div>
    );
  }

  return (
    <AddEditAppModal
      isOpen={true}
      onClose={() => navigate('/admin/home')}
      editingApp={app}
    />
  );
}
