import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Database, Cpu, BarChart3, ShieldAlert, Info,
  TrendingUp, ChevronLeft, ChevronRight, Shield, Menu, X
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}

const navItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'eda', label: 'Data Analysis', icon: Database },
  { id: 'preprocessing', label: 'Preprocessing', icon: TrendingUp },
  { id: 'models', label: 'Model Training', icon: Cpu },
  { id: 'evaluation', label: 'Evaluation', icon: BarChart3 },
  { id: 'prediction', label: 'Prediction', icon: ShieldAlert },
  { id: 'about', label: 'About', icon: Info },
];

export function Sidebar({ activeTab, setActiveTab, mobileOpen, setMobileOpen }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const handleNav = (id: string) => {
    setActiveTab(id);
    if (isMobile) setMobileOpen(false);
  };

  if (isMobile) {
    return (
      <>
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
              onClick={() => setMobileOpen(false)}
            />
          )}
        </AnimatePresence>
        <motion.aside
          initial={false}
          animate={{ x: mobileOpen ? 0 : -280 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed left-0 top-0 h-screen w-[260px] bg-slate-900 text-white z-[70] flex flex-col border-r border-slate-800"
        >
          <div className="p-5">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-blue-900/30">
                  <Shield size={22} />
                </div>
                <div>
                  <h1 className="text-lg font-bold tracking-tight">Sentinel AI</h1>
                  <p className="text-[10px] text-slate-400 -mt-0.5">Fraud Detection</p>
                </div>
              </div>
              <button onClick={() => setMobileOpen(false)} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400">
                <X size={20} />
              </button>
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all relative ${
                    activeTab === item.id
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                  {activeTab === item.id && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full" />
                  )}
                </button>
              ))}
            </nav>
          </div>
          <div className="mt-auto p-5 border-t border-slate-800">
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-800/50 rounded-xl">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <p className="text-xs font-medium text-slate-300">4 Models Ready</p>
            </div>
          </div>
        </motion.aside>
      </>
    );
  }

  return (
    <motion.aside
      animate={{ width: collapsed ? 80 : 256 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="bg-slate-900 text-white h-screen fixed left-0 top-0 z-50 flex flex-col border-r border-slate-800"
    >
      <div className="p-5">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-blue-900/30 shrink-0">
            <Shield size={22} />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                <h1 className="text-lg font-bold tracking-tight">Sentinel AI</h1>
                <p className="text-[10px] text-slate-400 -mt-0.5">Fraud Detection</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative overflow-hidden ${
                activeTab === item.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <item.icon size={18} className="shrink-0" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="whitespace-nowrap">
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {activeTab === item.id && (
                <motion.div layoutId="activeIndicator" className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full" />
              )}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-5 border-t border-slate-800">
        <div className={`bg-slate-800/50 rounded-xl p-4 ${collapsed ? 'px-2' : ''}`}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <p className="text-xs font-medium text-slate-300">4 Models Ready</p>
                  <p className="text-[10px] text-slate-500">KNN, LR, SVM, DT</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 mt-3 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors text-slate-400"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </motion.aside>
  );
}

export function MobileHeaderButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
    >
      <Menu size={22} />
    </button>
  );
}
