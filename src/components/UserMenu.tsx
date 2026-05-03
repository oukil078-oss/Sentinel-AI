import { motion, AnimatePresence } from 'framer-motion';
import { User, Settings, LogOut, FileText, Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface UserMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserMenu({ isOpen, onClose }: UserMenuProps) {
  const { isDark, toggleTheme } = useTheme();

  const menuItems = [
    { icon: User, label: 'Profile', desc: 'View your account' },
    { icon: FileText, label: 'Reports', desc: 'Download evaluation reports' },
    { icon: Settings, label: 'Settings', desc: 'Platform preferences' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[90]" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="absolute right-2 sm:right-8 top-14 sm:top-16 w-[calc(100vw-1rem)] sm:w-72 max-w-xs bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 z-[100] overflow-hidden"
          >
            <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white">
                  <User size={16} className="sm:w-[18px] sm:h-[18px]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Data Scientist</p>
                  <p className="text-[10px] sm:text-xs text-slate-400">data.scientist@university.edu</p>
                </div>
              </div>
            </div>

            <div className="py-1.5 sm:py-2">
              {menuItems.map((item, i) => (
                <button
                  key={i}
                  onClick={onClose}
                  className="w-full flex items-center gap-3 px-4 sm:px-5 py-2.5 sm:py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <item.icon size={15} className="text-slate-400 sm:w-4 sm:h-4" />
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200">{item.label}</p>
                    <p className="text-[10px] sm:text-[11px] text-slate-400">{item.desc}</p>
                  </div>
                </button>
              ))}

              <button
                onClick={() => { toggleTheme(); onClose(); }}
                className="w-full flex items-center gap-3 px-4 sm:px-5 py-2.5 sm:py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                {isDark ? <Sun size={15} className="text-slate-400 sm:w-4 sm:h-4" /> : <Moon size={15} className="text-slate-400 sm:w-4 sm:h-4" />}
                <div>
                  <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200">{isDark ? 'Light Mode' : 'Dark Mode'}</p>
                  <p className="text-[10px] sm:text-[11px] text-slate-400">Toggle theme</p>
                </div>
              </button>
            </div>

            <div className="px-4 sm:px-5 py-2.5 sm:py-3 border-t border-slate-100 dark:border-slate-700">
              <button onClick={onClose} className="w-full flex items-center gap-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors px-0 py-0">
                <LogOut size={15} className="text-rose-400 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm font-medium text-rose-500">Sign Out</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
