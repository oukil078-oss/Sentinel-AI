import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowRight, LayoutDashboard, Database, Cpu, BarChart3, ShieldAlert, Info, TrendingUp } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
}

const searchItems = [
  { id: 'overview', label: 'Platform Overview', desc: 'Dashboard with KPIs and live feed', icon: LayoutDashboard, keywords: 'dashboard home main stats' },
  { id: 'eda', label: 'Data Analysis', desc: 'Class distribution, correlation, data explorer', icon: Database, keywords: 'exploratory analysis distribution chart' },
  { id: 'preprocessing', label: 'Preprocessing Pipeline', desc: 'Scaling, SMOTE, train-test split', icon: TrendingUp, keywords: 'clean scale smote split' },
  { id: 'models', label: 'Model Training', desc: 'KNN and Random Forest training', icon: Cpu, keywords: 'train knn random forest' },
  { id: 'evaluation', label: 'Model Evaluation', desc: 'ROC, PR curves, confusion matrix', icon: BarChart3, keywords: 'evaluate metrics compare' },
  { id: 'prediction', label: 'Prediction Center', desc: 'Real-time fraud prediction', icon: ShieldAlert, keywords: 'predict test sample' },
  { id: 'about', label: 'About Project', desc: 'Methodology, tech stack, limitations', icon: Info, keywords: 'info documentation readme' },
];

export function SearchModal({ isOpen, onClose, onNavigate }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = query.trim() === ''
    ? searchItems
    : searchItems.filter(item =>
        item.label.toLowerCase().includes(query.toLowerCase()) ||
        item.desc.toLowerCase().includes(query.toLowerCase()) ||
        item.keywords.toLowerCase().includes(query.toLowerCase())
      );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') { setSelectedIndex(i => Math.min(i + 1, filtered.length - 1)); e.preventDefault(); }
      if (e.key === 'ArrowUp') { setSelectedIndex(i => Math.max(i - 1, 0)); e.preventDefault(); }
      if (e.key === 'Enter' && filtered[selectedIndex]) {
        onNavigate(filtered[selectedIndex].id);
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onClose, onNavigate]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-start justify-center pt-[10vh] sm:pt-[15vh] px-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-100 dark:border-slate-700">
              <Search size={18} className="text-slate-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
                placeholder="Search pages, features, or data..."
                className="flex-1 bg-transparent text-slate-900 dark:text-white text-sm sm:text-base outline-none placeholder:text-slate-400"
              />
              <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-[10px] text-slate-500 dark:text-slate-400 font-mono">ESC</div>
            </div>
            <div className="max-h-[280px] sm:max-h-[320px] overflow-y-auto py-1.5 sm:py-2">
              {filtered.length === 0 ? (
                <div className="px-5 py-8 sm:py-10 text-center text-slate-400 dark:text-slate-500 text-xs sm:text-sm">
                  No results found for "{query}"
                </div>
              ) : (
                filtered.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { onNavigate(item.id); onClose(); }}
                      onMouseEnter={() => setSelectedIndex(i)}
                      className={`w-full flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-2.5 sm:py-3 text-left transition-colors ${
                        i === selectedIndex ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <div className={`p-1.5 sm:p-2 rounded-lg shrink-0 ${i === selectedIndex ? 'bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                        <Icon size={16} className="sm:w-[18px] sm:h-[18px]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs sm:text-sm font-semibold ${i === selectedIndex ? 'text-blue-700 dark:text-blue-400' : 'text-slate-900 dark:text-white'}`}>{item.label}</p>
                        <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 truncate">{item.desc}</p>
                      </div>
                      {i === selectedIndex && <ArrowRight size={14} className="text-blue-500 shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>
            <div className="px-4 sm:px-5 py-2 sm:py-2.5 border-t border-slate-100 dark:border-slate-700 flex items-center gap-3 sm:gap-4 text-[10px] text-slate-400 dark:text-slate-500">
              <span className="flex items-center gap-1"><span className="px-1 py-0.5 bg-slate-100 dark:bg-slate-700 rounded font-mono text-[9px]">↑↓</span> Navigate</span>
              <span className="flex items-center gap-1"><span className="px-1 py-0.5 bg-slate-100 dark:bg-slate-700 rounded font-mono text-[9px]">↵</span> Select</span>
              <span className="hidden sm:flex items-center gap-1"><span className="px-1 py-0.5 bg-slate-100 dark:bg-slate-700 rounded font-mono text-[9px]">ESC</span> Close</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
