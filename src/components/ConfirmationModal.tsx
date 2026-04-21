import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'danger'
}) => {
  const { t } = useSettings();
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999] flex justify-center p-4 overflow-y-auto custom-scrollbar">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-void/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md glass-panel p-8 border-none shadow-2xl my-auto"
          >
            {/* Background Glow */}
            <div className={`absolute -top-24 -right-24 w-48 h-48 blur-[80px] opacity-20 ${
              variant === 'danger' ? 'bg-crimson' : variant === 'warning' ? 'bg-volt' : 'bg-white'
            }`} />

             <div className="relative z-10 flex flex-col items-center text-center">
              <div className={`w-16 h-16 flex items-center justify-center mb-6 border ${
                variant === 'danger' ? 'bg-crimson/10 border-crimson/20 text-crimson' : variant === 'warning' ? 'bg-volt/10 border-volt/20 text-volt' : 'bg-white/10 border-white/20 text-white'
              }`}>
                <AlertTriangle size={32} />
              </div>
              
              <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-4 text-white">{title}</h3>
              
              {message && (
                <p className="text-zinc-400 text-sm font-medium leading-relaxed mb-8">
                  {message}
                </p>
              )}

              <div className="flex w-full gap-4 pt-4 border-t border-white/5">
                <button
                  onClick={onCancel}
                  className="flex-1 py-4 border-none bg-surface-container-low text-zinc-500 font-headline text-[10px] font-black uppercase tracking-widest hover:bg-surface-container-high hover:text-white transition-all"
                >
                  {cancelLabel}
                </button>
                <button
                  onClick={onConfirm}
                  className={`flex-1 py-4 font-headline text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${
                    variant === 'danger' 
                      ? 'btn-destructive' 
                      : variant === 'warning'
                      ? 'bg-volt text-void hover:bg-white'
                      : 'bg-white text-void hover:bg-zinc-200'
                  }`}
                >
                  {confirmLabel}
                </button>
              </div>
            </div>

            <button 
              onClick={onCancel}
              className="absolute top-6 right-6 text-zinc-600 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
