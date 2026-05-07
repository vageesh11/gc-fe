import { useEffect } from 'react';

interface AlertDialogProps {
  open: boolean;
  title?: string;
  message: string;
  variant?: 'error' | 'success' | 'info';
  onClose: () => void;
}

const variantStyles = {
  error:   { accent: 'from-red-700 to-red-500',     icon: '⚠', text: 'text-red-400',    btn: 'border-red-700/40 text-red-500 hover:text-red-300' },
  success: { accent: 'from-cyan-700 to-cyan-500',   icon: '✓', text: 'text-cyan-400',   btn: 'border-cyan-700/40 text-cyan-500 hover:text-cyan-300' },
  info:    { accent: 'from-purple-700 to-purple-500', icon: '◈', text: 'text-purple-400', btn: 'border-purple-700/40 text-purple-400 hover:text-purple-200' },
};

export function AlertDialog({ open, title, message, variant = 'error', onClose }: AlertDialogProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const styles = variantStyles[variant];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[#0f0f1e] border border-purple-700/50 w-full max-w-md mx-4 shadow-2xl">
        <div className={`h-[2px] bg-gradient-to-r ${styles.accent}`} />
        <div className="px-6 pt-5 pb-3 flex items-center gap-3">
          <span className={`text-xl ${styles.text}`}>{styles.icon}</span>
          <h2 className="font-orbitron text-sm font-bold text-white tracking-widest uppercase">
            {title ?? (variant === 'error' ? 'Error' : variant === 'success' ? 'Success' : 'Info')}
          </h2>
        </div>
        <div className="px-6 pb-6">
          <p className="text-gray-400 text-sm leading-relaxed">{message}</p>
          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className={`px-6 py-2 text-xs font-bold tracking-widest uppercase border transition-colors ${styles.btn}`}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
