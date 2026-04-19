import { useEffect, lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import useAppStore from './store/useAppStore';
import Navbar from './components/layout/Navbar';
import ToastContainer from './components/layout/ToastContainer';
import CursorEffect from './components/effects/CursorEffect';
import BackgroundOrbs from './components/effects/BackgroundOrbs';
import PageLoader from './components/effects/PageLoader';

// Pages
import IndexPage from './pages/IndexPage';
import AppDetailPage from './pages/AppDetailPage';
import SearchPage from './pages/SearchPage';
import ContactPage from './pages/ContactPage';
import AdminHomePage from './pages/admin/AdminHomePage';
import AdminAddAppPage from './pages/admin/AdminAddAppPage';
import AdminContactsPage from './pages/admin/AdminContactsPage';

import React, { useState } from 'react';

function ProtectedRoute({ children }) {
  const isAdmin = useAppStore(s => s.isAdmin);
  const [checked, setChecked] = useState(false);
  
  useEffect(() => {
    setChecked(true);
  }, []);
  
  if (!checked) return <PageLoader />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}

class AdminErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', color: 'white',
          gap: '16px', padding: '32px', position: 'relative', zIndex: 100
        }}>
          <h2 style={{ fontSize: '24px', color: '#f87171' }}>⚠️ Admin Page Error</h2>
          <pre style={{
            background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px',
            fontSize: '12px', color: '#94a3b8', maxWidth: '600px', overflow: 'auto',
            whiteSpace: 'pre-wrap'
          }}>
            {this.state.error?.toString()}
            {this.state.error?.stack}
          </pre>
          <button 
            onClick={() => window.location.href = '/MR-JK-MART/#/'}
            style={{
              padding: '12px 24px', background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
              border: 'none', borderRadius: '12px', color: 'white', cursor: 'pointer', fontSize: '16px'
            }}
          >
            ← Go Home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<IndexPage />} />
        <Route path="/app/:appId" element={<AppDetailPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/admin/*" element={
          <AdminErrorBoundary>
            <Routes>
              <Route path="home" element={<ProtectedRoute><AdminHomePage /></ProtectedRoute>} />
              <Route path="add-app" element={<ProtectedRoute><AdminAddAppPage /></ProtectedRoute>} />
              <Route path="edit-app/:appId" element={<ProtectedRoute><AdminAddAppPage /></ProtectedRoute>} />
              <Route path="contacts" element={<ProtectedRoute><AdminContactsPage /></ProtectedRoute>} />
            </Routes>
          </AdminErrorBoundary>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  const { theme, setTheme, pageLoading } = useAppStore();

  useEffect(() => {
    // Initialize theme
    const saved = localStorage.getItem('mrjk-theme') || 'dark';
    setTheme(saved);
  }, []);

  return (
    <HashRouter>
      <div className={`${theme} page-bg min-h-screen relative`}>
        <BackgroundOrbs />
        <CursorEffect />
        <Navbar />
        <ToastContainer />
        
        {pageLoading && <PageLoader />}
        
        <main className="relative z-10">
          <AnimatedRoutes />
        </main>
      </div>
    </HashRouter>
  );
}
