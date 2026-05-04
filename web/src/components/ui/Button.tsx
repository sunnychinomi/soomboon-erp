import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'default' | 'primary' | 'rust' | 'gold' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  default: 'bg-white border border-rule-strong text-ink hover:bg-paper-2 hover:border-ink',
  primary: 'bg-ink text-white border border-ink hover:bg-indigo',
  rust: 'bg-rust text-white border border-rust hover:bg-rust-dark',
  gold: 'btn-gold',
  ghost: 'text-mute hover:bg-paper-2 hover:text-ink',
};

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3 text-sm',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center gap-2 rounded-lg font-medium transition-all whitespace-nowrap',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = 'Button';
