import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { useSettings } from './SettingsContext';

type ToastType = 'success' | 'warning' | 'info' | 'error';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, duration?: number, type?: ToastType) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useSettings();
  const [toasts, setToasts] = useState<Toast[]>([]);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, duration = 3000, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    
    // For auto-regulation warnings, we might want to avoid duplicates if they happen too fast
    // But since we are recreating, let's just add it.
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    if (duration !== Infinity) {
      setTimeout(() => {
        hideToast(id);
      }, duration);
    }
  }, [hideToast]);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-3 w-full max-w-sm px-4 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
              className="pointer-events-auto"
            >
              <div className={cn(
                "flex items-center gap-3 p-4 border shadow-2xl backdrop-blur-xl relative overflow-hidden group",
                toast.type === 'success' && "bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)]",
                toast.type === 'warning' && "bg-orange-500/15 border-orange-500/60 text-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.15)]",
                toast.type === 'error' && "bg-crimson/10 border-crimson/50 text-crimson",
                toast.type === 'info' && "bg-void/80 border-volt/30 text-volt"
              )}>
                {/* Tactical Accent */}
                <div className={cn(
                  "absolute top-0 left-0 w-1 h-full",
                  toast.type === 'success' && "bg-emerald-500",
                  toast.type === 'warning' && "bg-orange-500",
                  toast.type === 'error' && "bg-crimson",
                  toast.type === 'info' && "bg-volt"
                )} />

                <div className="shrink-0 pt-0.5">
                  {toast.type === 'success' && <CheckCircle2 size={16} className="drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />}
                  {toast.type === 'warning' && <AlertTriangle size={16} className="drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]" />}
                  {toast.type === 'error' && <XCircle size={16} />}
                  {toast.type === 'info' && <Info size={16} />}
                </div>

                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <span className="text-[7px] font-black uppercase tracking-[0.2em] opacity-50 block leading-none">
                    {t(`toast.${toast.type}`)}
                  </span>
                  <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.05em] leading-tight">
                    {toast.message}
                  </p>
                </div>

                <button 
                  onClick={() => hideToast(toast.id)}
                  className="shrink-0 hover:scale-110 transition-transform p-1 opacity-50 hover:opacity-100"
                >
                  <X size={14} />
                </button>

                {/* Progress bar for auto-hide */}
                {toast.duration !== Infinity && (
                  <motion.div 
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: toast.duration / 1000, ease: "linear" }}
                    className={cn(
                      "absolute bottom-0 left-0 h-0.5 opacity-30",
                      toast.type === 'success' && "bg-emerald-500",
                      toast.type === 'warning' && "bg-orange-500",
                      toast.type === 'error' && "bg-crimson",
                      toast.type === 'info' && "bg-volt"
                    )}
                  />
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
