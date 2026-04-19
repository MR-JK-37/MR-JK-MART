import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Sun, Moon, Shield } from 'lucide-react';
import useAppStore from '../../store/useAppStore';

const navLinks = [
  { path: '/', label: 'Home' },
  { path: '/search', label: 'Search' },
  { path: '/contact', label: 'Contact' },
];

const adminLinks = [
  { path: '/admin/home', label: 'Admin Panel' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const theme = useAppStore(s => s.theme);
  const toggleTheme = useAppStore(s => s.toggleTheme);
  const isAdmin = useAppStore(s => s.isAdmin);
  const logout = useAppStore(s => s.logout);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Don't show on splash
  const isSplash = location.pathname === '/' || location.pathname === '';

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: (isSplash && !scrolled) ? -100 : 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 30 }}
        className="fixed top-4 left-4 right-4 z-[100] glass"
        style={{ borderRadius: 16, padding: '12px 24px' }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-1 no-underline">
            <span className="font-display text-xl font-bold gradient-text">MR!JK!</span>
            <span className={`font-display text-xl font-light ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              MART
            </span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(link => (
              <NavLink key={link.path} to={link.path} label={link.label} location={location} theme={theme} />
            ))}
            {isAdmin && adminLinks.map(link => (
              <NavLink key={link.path} to={link.path} label={link.label} location={location} theme={theme} />
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {isAdmin && (
              <div className="hidden md:flex items-center gap-2">
                <span className="text-xs font-mono px-3 py-1 rounded-full gradient-bg text-white flex items-center gap-1">
                  <Shield size={12} /> ADMIN
                </span>
                <button
                  onClick={logout}
                  className="text-xs px-3 py-1 rounded-full btn-glass"
                >
                  Logout
                </button>
              </div>
            )}

            {/* Theme Toggle */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={toggleTheme}
              className={`p-2 rounded-full transition-colors ${
                theme === 'dark' 
                  ? 'text-yellow-300 hover:bg-yellow-300/10' 
                  : 'text-indigo-600 hover:bg-indigo-600/10'
              }`}
              aria-label="Toggle theme"
            >
              <AnimatePresence mode="wait">
                {theme === 'dark' ? (
                  <motion.div key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                    <Sun size={20} />
                  </motion.div>
                ) : (
                  <motion.div key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                    <Moon size={20} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Mobile Menu */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 rounded-lg"
              aria-label="Menu"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99] liquid-glass"
            style={{ backdropFilter: 'blur(30px)' }}
          >
            <div className="flex flex-col items-center justify-center h-full gap-8">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.path}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link
                    to={link.path}
                    onClick={() => setIsOpen(false)}
                    className={`font-display text-3xl font-bold no-underline transition-colors ${
                      location.pathname === link.path ? 'gradient-text' : theme === 'dark' ? 'text-white' : 'text-gray-800'
                    }`}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              {isAdmin && (
                <>
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Link
                      to="/admin/home"
                      onClick={() => setIsOpen(false)}
                      className="font-display text-3xl font-bold gradient-text no-underline"
                    >
                      Admin Panel
                    </Link>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <button onClick={() => { logout(); setIsOpen(false); }} className="btn-gradient text-lg">
                      Logout
                    </button>
                  </motion.div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function NavLink({ to, label, location, theme }) {
  const isActive = location.pathname === to || location.pathname.startsWith(to + '/');
  return (
    <Link
      to={to}
      className={`relative font-body text-sm font-medium no-underline transition-colors pb-1 ${
        isActive
          ? 'gradient-text'
          : theme === 'dark'
            ? 'text-gray-300 hover:text-white'
            : 'text-gray-600 hover:text-gray-900'
      }`}
    >
      {label}
      {isActive && (
        <motion.div
          layoutId="navIndicator"
          className="absolute bottom-0 left-0 right-0 h-0.5 gradient-bg rounded-full"
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        />
      )}
    </Link>
  );
}
