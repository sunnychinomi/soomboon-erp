import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type PillVariant = 'success' | 'warn' | 'danger' | 'info' | 'muted' | 'gold' | 'rust';

interface PillProps {
  variant?: PillVariant;
  children: ReactNode;
  className?: string;
}

const variants: Record<PillVariant, string> = {
  success: 'bg-green-50 text-green-700',
  warn:    'bg-yellow-50 text-yellow-700',
  danger:  'bg-burgundy-soft text-burgundy',
  info:    'bg-steel-glow text-indigo',
  muted:   'bg-paper-2 text-mute',
  gold:    'bg-gold-glow text-gold-dark',
  rust:    'bg-rust-glow text-rust-dark',
};

export function Pill({ variant = 'muted', children, className }: PillProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap',
      variants[variant],
      className,
    )}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}
