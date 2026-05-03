import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

let toastId = 0;
const listeners: ((toasts: Toast[]) => void)[] = [];
let toasts: Toast[] = [];

function notify(message: string, type: 'success' | 'error' | 'info' = 'info') {
  const id = ++toastId;
  toasts = [...toasts, { id, message, type }];
  listeners.forEach(l => l(toasts));
  setTimeout(() => {
    toasts = toasts.filter(t => t.id !== id);
    listeners.forEach(l => l(toasts));
  }, 4000);
}

export const toast = { success: (m: string) => notify(m, 'success'), error: (m: string) => notify(m, 'error'), info: (m: string) => notify(m, 'info') };

export function ToastContainer() {
  const [currentToasts, setCurrentToasts] = useState<Toast[]>([]);

  useEffect(() => {
    listeners.push(setCurrentToasts);
    return () => { listeners.splice(listeners.indexOf(setCurrentToasts), 1); };
  }, []);

  const icons = { success: CheckCircle, error: AlertTriangle, info: Info };
  const colors = { success: 'bg-emerald-500', error: 'bg-rose-500', info: 'bg-blue-500' };

  return (
    <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3">
      <AnimatePresence>
        {currentToasts.map(t => {
          const Icon = icons[t.type];
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              className={`flex items-center gap-3 px-5 py-3 rounded-xl text-white shadow-2xl min-w-[320px] ${colors[t.type]}`}
            >
              <Icon size={20} />
              <span className="text-sm font-medium flex-1">{t.message}</span>
              <button onClick={() => { toasts = toasts.filter(x => x.id !== t.id); listeners.forEach(l => l(toasts)); }}>
                <X size={16} className="opacity-70 hover:opacity-100" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
