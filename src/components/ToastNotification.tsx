'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Info, ShoppingBag, Shield, Zap, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'purchase' | 'ban' | 'xp';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

// Global toast queue — allows any component to trigger toasts
let addToastFn: ((toast: Omit<Toast, 'id'>) => void) | null = null;

export const showToast = (toast: Omit<Toast, 'id'>) => {
  if (addToastFn) addToastFn(toast);
};

const TOAST_CONFIGS = {
  success: {
    icon: CheckCircle2,
    bg: 'bg-emerald-50 border-emerald-200',
    icon_color: 'text-emerald-600',
    title_color: 'text-emerald-900',
    msg_color: 'text-emerald-700',
    progress: 'bg-emerald-500',
  },
  error: {
    icon: XCircle,
    bg: 'bg-red-50 border-red-200',
    icon_color: 'text-red-600',
    title_color: 'text-red-900',
    msg_color: 'text-red-700',
    progress: 'bg-red-500',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-amber-50 border-amber-200',
    icon_color: 'text-amber-600',
    title_color: 'text-amber-900',
    msg_color: 'text-amber-700',
    progress: 'bg-amber-500',
  },
  info: {
    icon: Info,
    bg: 'bg-blue-50 border-blue-200',
    icon_color: 'text-blue-600',
    title_color: 'text-blue-900',
    msg_color: 'text-blue-700',
    progress: 'bg-blue-500',
  },
  purchase: {
    icon: ShoppingBag,
    bg: 'bg-indigo-50 border-indigo-200',
    icon_color: 'text-indigo-600',
    title_color: 'text-indigo-900',
    msg_color: 'text-indigo-700',
    progress: 'bg-indigo-500',
  },
  ban: {
    icon: Shield,
    bg: 'bg-red-50 border-red-300',
    icon_color: 'text-red-700',
    title_color: 'text-red-900',
    msg_color: 'text-red-800',
    progress: 'bg-red-600',
  },
  xp: {
    icon: Zap,
    bg: 'bg-blue-50 border-blue-200',
    icon_color: 'text-blue-600',
    title_color: 'text-blue-900',
    msg_color: 'text-blue-700',
    progress: 'bg-blue-500',
  },
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const config = TOAST_CONFIGS[toast.type];
  const Icon = config.icon;
  const duration = toast.duration || 4000;
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => Math.max(0, prev - 100 / (duration / 100)));
    }, 100);
    const timeout = setTimeout(() => onDismiss(toast.id), duration);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [toast.id, duration, onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`relative w-[340px] rounded-2xl border shadow-2xl shadow-slate-900/10 overflow-hidden ${config.bg}`}
    >
      {/* Content */}
      <div className="flex items-start gap-4 p-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${config.bg} border ${config.bg.includes('border') ? '' : 'border-white'}`}>
          <Icon className={`w-5 h-5 ${config.icon_color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold leading-tight ${config.title_color}`}>{toast.title}</p>
          {toast.message && (
            <p className={`text-xs mt-1 leading-relaxed ${config.msg_color}`}>{toast.message}</p>
          )}
        </div>
        <button
          onClick={() => onDismiss(toast.id)}
          className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors hover:bg-black/5 ${config.icon_color}`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/5">
        <div
          className={`h-full ${config.progress} transition-all duration-100`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </motion.div>
  );
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2);
    setToasts(prev => [...prev.slice(-4), { ...toast, id }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    addToastFn = addToast;
    return () => { addToastFn = null; };
  }, [addToast]);

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onDismiss={dismissToast} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
