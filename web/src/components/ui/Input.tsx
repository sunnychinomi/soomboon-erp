import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasIcon?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, hasIcon, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full px-3 py-2.5 border border-rule-strong rounded-lg bg-white text-sm focus:outline-none focus:border-ink focus:ring-2 focus:ring-ink/5 transition-colors',
        hasIcon && 'pl-10',
        className
      )}
      {...props}
    />
  )
);
Input.displayName = 'Input';

interface FieldProps {
  label?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Field({ label, icon, children, className }: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label className="font-mono text-[10px] tracking-[0.14em] uppercase text-mute font-medium">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mute pointer-events-none">
            {icon}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
