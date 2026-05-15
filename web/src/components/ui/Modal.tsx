import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizes = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
};

export function Modal({ open, onClose, title, description, children, footer, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 animate-fade-up">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-indigo/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className={cn(
        'relative w-full bg-white rounded-2xl shadow-card-lg max-h-[90vh] overflow-hidden flex flex-col',
        sizes[size],
      )}>
        {/* Header */}
        <div className="px-7 py-5 border-b border-rule flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display font-medium text-2xl tracking-tight">{title}</h2>
            {description && <p className="text-mute text-sm mt-1">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 grid place-items-center rounded-lg hover:bg-paper text-mute hover:text-ink transition-colors flex-none"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-7 py-6 overflow-y-auto flex-1">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-7 py-4 border-t border-rule bg-paper flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
