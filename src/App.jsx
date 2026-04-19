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
import SplashPage from './pages/SplashPage';
import HomePage from './pages/HomePage';
import AppDetailPage from './pages/AppDetailPage';
import SearchPage from './pages/SearchPage';
import ContactPage from './pages/ContactPage';
import AdminHomePage from './pages/admin/AdminHomePage';
import AdminAddAppPage from './pages/admin/AdminAddAppPage';
import AdminContactsPage from './pages/admin/AdminContactsPage';

function ProtectedRoute({ children }) {
  const isAdmin = useAppStore(s => s.isAdmin);
  if (!isAdmin) return <Navigate to="/home" replace />;
  return children;
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<SplashPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/app/:appId" element={<AppDetailPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/admin/home" element={<ProtectedRoute><AdminHomePage /></ProtectedRoute>} />
        <Route path="/admin/add-app" element={<ProtectedRoute><AdminAddAppPage /></ProtectedRoute>} />
        <Route path="/admin/edit-app/:appId" element={<ProtectedRoute><AdminAddAppPage /></ProtectedRoute>} />
        <Route path="/admin/contacts" element={<ProtectedRoute><AdminContactsPage /></ProtectedRoute>} />
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
