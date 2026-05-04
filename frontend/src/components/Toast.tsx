import { createContext, useCallback, useContext, useState, ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";
type Toast = { id: number; type: ToastType; message: string };

type Ctx = {
  toast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<Ctx | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="pointer-events-auto flex items-center gap-3 pl-4 pr-5 py-3 rounded-2xl glass border border-white/10 shadow-2xl min-w-[280px] max-w-[380px]"
              data-testid={`toast-${t.type}`}
            >
              {t.type === "success" && <CheckCircle2 className="w-5 h-5 text-[#C6F24E] shrink-0" strokeWidth={2} />}
              {t.type === "error" && <AlertCircle className="w-5 h-5 text-[#FF3B30] shrink-0" strokeWidth={2} />}
              {t.type === "info" && <Info className="w-5 h-5 text-[#5AC8FA] shrink-0" strokeWidth={2} />}
              <p className="text-sm text-white font-medium flex-1">{t.message}</p>
              <button
                onClick={() => setToasts((p) => p.filter((x) => x.id !== t.id))}
                className="text-[#8A8A93] hover:text-white"
              >
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
