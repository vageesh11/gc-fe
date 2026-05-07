import React from 'react';

interface BadgeProps {
  variant?: 'success' | 'danger' | 'warning' | 'info' | 'neutral';
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<string, string> = {
  success: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/40',
  danger:  'bg-red-500/10 text-red-400 border border-red-500/40',
  warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/40',
  info:    'bg-purple-500/10 text-purple-400 border border-purple-500/40',
  neutral: 'bg-gray-700/40 text-gray-400 border border-gray-600/40',
};

export function Badge({ variant = 'neutral', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold tracking-wider uppercase ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
