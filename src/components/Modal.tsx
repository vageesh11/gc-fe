import React, { useEffect } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  dismissible?: boolean;
}

export function Modal({ open, onClose, title, children, dismissible = true }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissible) onClose();
    };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose, dismissible]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget && dismissible) onClose(); }}
    >
      <div className="bg-[#0f0f1e] border border-purple-700/50 w-full max-w-lg mx-4 max-h-[90vh] flex flex-col shadow-2xl glow-purple">
        {/* Top accent */}
        <div className="h-[2px] bg-gradient-to-r from-purple-600 to-cyan-500" />
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-purple-900/40">
          <h2 className="font-orbitron text-sm font-bold text-purple-300 tracking-widest uppercase">
            {title}
          </h2>
          {dismissible && (
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-purple-400 transition-colors text-xl leading-none font-bold"
            >
              ✕
            </button>
          )}
        </div>
        <div className="overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}
