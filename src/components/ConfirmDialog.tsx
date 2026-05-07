import { useEffect } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

const variantStyles = {
  danger:  { btn: 'bg-red-700/20 border-red-600/50 text-red-400 hover:bg-red-700/40 hover:text-red-200', icon: '⚠', accent: 'from-red-700 to-red-500' },
  warning: { btn: 'bg-amber-700/20 border-amber-600/50 text-amber-400 hover:bg-amber-700/40 hover:text-amber-200', icon: '⚡', accent: 'from-amber-700 to-amber-500' },
  info:    { btn: 'bg-purple-600/20 border-purple-500/60 text-purple-300 hover:bg-purple-600/40 hover:text-white', icon: '◈', accent: 'from-purple-700 to-cyan-600' },
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onCancel]);

  if (!open) return null;

  const styles = variantStyles[variant];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="bg-[#0f0f1e] border border-purple-700/50 w-full max-w-md mx-4 shadow-2xl">
        {/* Top accent */}
        <div className={`h-[2px] bg-gradient-to-r ${styles.accent}`} />

        {/* Header */}
        <div className="px-6 pt-5 pb-3 flex items-center gap-3">
          <span className="text-xl">{styles.icon}</span>
          <h2 className="font-orbitron text-sm font-bold text-white tracking-widest uppercase">{title}</h2>
        </div>

        {/* Body */}
        <div className="px-6 pb-6">
          <p className="text-gray-400 text-sm leading-relaxed">{message}</p>

          <div className="flex gap-3 mt-6 justify-end">
            <button
              onClick={onCancel}
              className="px-5 py-2 text-xs font-bold tracking-widest uppercase border border-gray-700/40 text-gray-500 hover:text-gray-300 hover:border-gray-500/50 transition-colors"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className={`px-5 py-2 text-xs font-bold tracking-widest uppercase border transition-all ${styles.btn}`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
