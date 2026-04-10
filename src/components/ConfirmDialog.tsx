import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, X, Info, ShieldAlert } from 'lucide-react';

export interface ConfirmDialogProps {
  open: boolean;
  variant?: 'danger' | 'warning' | 'info';
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const VARIANTS = {
  danger: {
    iconBg:     'bg-red-100',
    iconColor:  'text-red-500',
    icon:       Trash2,
    btnBg:      'bg-red-500 hover:bg-red-600 shadow-red-100',
  },
  warning: {
    iconBg:     'bg-amber-100',
    iconColor:  'text-amber-500',
    icon:       AlertTriangle,
    btnBg:      'bg-amber-500 hover:bg-amber-600 shadow-amber-100',
  },
  info: {
    iconBg:     'bg-blue-100',
    iconColor:  'text-blue-500',
    icon:       Info,
    btnBg:      'bg-blue-600 hover:bg-blue-700 shadow-blue-100',
  },
};

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  variant = 'danger',
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  loading = false,
  onConfirm,
  onCancel,
}) => {
  const cfg = VARIANTS[variant];
  const Icon = cfg.icon;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.45)' }}
          onClick={e => { if (e.target === e.currentTarget && !loading) onCancel(); }}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 8 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
          >
            {/* Top accent bar */}
            <div className={`h-1 w-full ${variant === 'danger' ? 'bg-red-400' : variant === 'warning' ? 'bg-amber-400' : 'bg-blue-500'}`} />

            <div className="p-7">
              {/* Close */}
              <div className="flex justify-end mb-1">
                <button
                  onClick={onCancel}
                  disabled={loading}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Icon */}
              <div className={`w-14 h-14 ${cfg.iconBg} rounded-2xl flex items-center justify-center mx-auto mb-5`}>
                <Icon size={26} className={cfg.iconColor} />
              </div>

              {/* Text */}
              <h3 className="text-[17px] font-black text-slate-900 text-center mb-2">{title}</h3>
              <p className="text-sm text-slate-500 text-center leading-relaxed">{message}</p>

              {/* Buttons */}
              <div className="flex gap-3 mt-7">
                <button
                  onClick={onCancel}
                  disabled={loading}
                  className="flex-1 py-3 text-sm font-bold text-slate-600 bg-slate-100
                             hover:bg-slate-200 rounded-2xl transition-colors disabled:opacity-50"
                >
                  {cancelLabel}
                </button>
                <button
                  onClick={onConfirm}
                  disabled={loading}
                  className={`flex-1 py-3 text-sm font-bold text-white rounded-2xl shadow-lg
                              transition-all active:scale-95 disabled:opacity-60 ${cfg.btnBg}
                              flex items-center justify-center gap-2`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
                      </svg>
                      Processing…
                    </>
                  ) : confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmDialog;
