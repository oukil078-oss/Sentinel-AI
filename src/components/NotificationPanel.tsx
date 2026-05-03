import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, CheckCircle2, AlertTriangle, Info, Clock } from 'lucide-react';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'info';
  time: string;
  read: boolean;
}

const initialNotifications: Notification[] = [
  { id: 1, title: 'Random Forest Training Complete', message: 'Model achieved 99.95% accuracy and 0.97 ROC-AUC', type: 'success', time: '2 min ago', read: false },
  { id: 2, title: 'High Fraud Alert', message: 'Transaction TX-88423 flagged with 94% confidence', type: 'warning', time: '5 min ago', read: false },
  { id: 3, title: 'Dataset Loaded', message: '284,807 transactions loaded from KaggleHub', type: 'info', time: '12 min ago', read: true },
  { id: 4, title: 'SMOTE Applied', message: 'Training set balanced: 227,451 fraud / 227,451 legit', type: 'success', time: '15 min ago', read: true },
  { id: 5, title: 'KNN Training Complete', message: 'Model achieved 99.84% accuracy and 0.92 ROC-AUC', type: 'success', time: '18 min ago', read: true },
];

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const markRead = (id: number) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const clearAll = () => setNotifications([]);

  const icons = { success: CheckCircle2, warning: AlertTriangle, info: Info };
  const colors = {
    success: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20',
    warning: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20',
    info: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
  };

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
            className="absolute right-2 sm:right-8 top-14 sm:top-16 w-[calc(100vw-1rem)] sm:w-96 max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 z-[100] overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Bell size={15} className="text-slate-500 dark:text-slate-400" />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-[10px] font-bold rounded-full">{unreadCount} new</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={markAllRead} className="text-[10px] sm:text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium">Mark all read</button>
                <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                  <X size={14} className="text-slate-400" />
                </button>
              </div>
            </div>

            <div className="max-h-[300px] sm:max-h-[360px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-5 py-10 sm:py-12 text-center">
                  <Bell size={28} className="text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-500">No notifications</p>
                </div>
              ) : (
                notifications.map(n => {
                  const Icon = icons[n.type];
                  return (
                    <button
                      key={n.id}
                      onClick={() => markRead(n.id)}
                      className={`w-full flex items-start gap-2.5 sm:gap-3 px-4 sm:px-5 py-3 sm:py-3.5 text-left transition-colors border-b border-slate-50 dark:border-slate-700/50 last:border-0 ${
                        n.read ? '' : 'bg-blue-50/30 dark:bg-blue-900/10'
                      } hover:bg-slate-50 dark:hover:bg-slate-700/30`}
                    >
                      <div className={`p-1.5 sm:p-2 rounded-lg shrink-0 ${colors[n.type]}`}>
                        <Icon size={14} className="sm:w-4 sm:h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-xs sm:text-sm font-semibold truncate ${n.read ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white'}`}>{n.title}</p>
                          {!n.read && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0" />}
                        </div>
                        <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{n.message}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock size={10} className="text-slate-400" />
                          <span className="text-[10px] text-slate-400">{n.time}</span>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {notifications.length > 0 && (
              <div className="px-4 sm:px-5 py-2.5 sm:py-3 border-t border-slate-100 dark:border-slate-700">
                <button onClick={clearAll} className="w-full text-center text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 hover:text-rose-500 transition-colors font-medium">Clear all notifications</button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
