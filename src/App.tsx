import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar, MobileHeaderButton } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { EDA } from './components/EDA';
import { Preprocessing } from './components/Preprocessing';
import { Models } from './components/Models';
import { ModelEvaluation } from './components/ModelEvaluation';
import { PredictionCenter } from './components/PredictionCenter';
import { About } from './components/About';
import { SearchModal } from './components/SearchModal';
import { NotificationPanel } from './components/NotificationPanel';
import { UserMenu } from './components/UserMenu';
import { LoadingScreen } from './components/LoadingScreen';
import { ToastContainer } from './components/Toast';
import { ThemeProvider } from './context/ThemeContext';
import { Bell, Search, User, Command } from 'lucide-react';

function AppContent() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleNavigate = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
        setNotifOpen(false);
        setUserMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (searchOpen) { setNotifOpen(false); setUserMenuOpen(false); }
  }, [searchOpen]);
  useEffect(() => {
    if (notifOpen) { setSearchOpen(false); setUserMenuOpen(false); }
  }, [notifOpen]);
  useEffect(() => {
    if (userMenuOpen) { setSearchOpen(false); setNotifOpen(false); }
  }, [userMenuOpen]);

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return <Dashboard />;
      case 'eda': return <EDA />;
      case 'preprocessing': return <Preprocessing />;
      case 'models': return <Models />;
      case 'evaluation': return <ModelEvaluation />;
      case 'prediction': return <PredictionCenter />;
      case 'about': return <About />;
      default: return <Dashboard />;
    }
  };

  return (
    <>
      <AnimatePresence>
        {loading && <LoadingScreen onComplete={() => setLoading(false)} />}
      </AnimatePresence>

      <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors duration-300 ${loading ? 'overflow-hidden' : ''}`}>
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          mobileOpen={mobileSidebarOpen}
          setMobileOpen={setMobileSidebarOpen}
        />

        <main className="flex-1 lg:ml-64 min-h-screen flex flex-col transition-all duration-300">
          {/* Header */}
          <header className="h-14 sm:h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-40">
            <div className="flex items-center gap-3">
              <MobileHeaderButton onClick={() => setMobileSidebarOpen(true)} />
              <button
                onClick={() => setSearchOpen(true)}
                className="hidden sm:flex items-center gap-3 bg-slate-100/80 dark:bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors text-left w-64 lg:w-96"
              >
                <Search size={18} className="text-slate-400 shrink-0" />
                <span className="text-sm text-slate-400 flex-1 truncate">Search analytics, logs, or transactions...</span>
                <div className="hidden lg:flex items-center gap-1 px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[10px] text-slate-500 dark:text-slate-400 font-mono shrink-0">
                  <Command size={10} />
                  K
                </div>
              </button>
              <button
                onClick={() => setSearchOpen(true)}
                className="sm:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <Search size={20} />
              </button>
            </div>

            <div className="flex items-center gap-3 sm:gap-5">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors relative p-1"
              >
                <Bell size={20} />
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />
              </button>
              <div className="hidden sm:block w-px h-6 bg-slate-200 dark:bg-slate-700" />
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 sm:gap-3 group"
              >
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Data Scientist</p>
                  <p className="text-[10px] text-slate-400">Admin</p>
                </div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                  <User size={16} className="sm:w-[18px] sm:h-[18px]" />
                </div>
              </button>
            </div>
          </header>

          {/* Panels */}
          <NotificationPanel isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
          <UserMenu isOpen={userMenuOpen} onClose={() => setUserMenuOpen(false)} />
          <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} onNavigate={handleNavigate} />

          {/* Content */}
          <div className="p-4 sm:p-6 lg:p-8 flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <footer className="px-4 sm:px-8 py-4 sm:py-5 border-t border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur text-slate-400 dark:text-slate-500 text-xs flex flex-col sm:flex-row justify-between items-center gap-2">
            <p>© 2024 Sentinel AI Platform. Academic Presentation.</p>
            <div className="flex gap-4 sm:gap-6">
              <button onClick={() => setActiveTab('about')} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Technical Docs</button>
              <button onClick={() => setActiveTab('about')} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Privacy Policy</button>
              <span className="hidden sm:flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                All Systems Operational
              </span>
            </div>
          </footer>
        </main>

        <ToastContainer />
      </div>
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
