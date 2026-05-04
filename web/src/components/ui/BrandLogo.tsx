import { useState } from 'react';
import { cn } from '@/lib/utils';

interface BrandLogoProps {
  width?: number;
  mono?: boolean;
  className?: string;
}

export function BrandLogo({ width = 320, mono = false, className }: BrandLogoProps) {
  const [error, setError] = useState(false);

  if (!error) {
    return (
      <img
        src={mono ? '/logo-mono.png' : '/logo.png'}
        alt="S.ARAN OIL & AUTOPART CO.,LTD."
        onError={() => setError(true)}
        style={{ maxWidth: `${width}px`, width: '100%', height: 'auto', display: 'block' }}
        className={className}
      />
    );
  }

  // Fallback when image is missing
  const saSize = width * 0.42;
  const nameSize = width * 0.04;
  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <span className={cn('sa-mark', mono && 'mono')} style={{ fontSize: saSize }}>SA</span>
      <div
        className={cn('font-display font-bold tracking-[0.18em]', mono && 'text-ink')}
        style={{
          fontSize: nameSize,
          ...(mono ? {} : {
            background: 'linear-gradient(180deg, #f0e1a3 0%, #d4b932 50%, #B7990D 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }),
          whiteSpace: 'nowrap',
        }}
      >
        S.ARAN OIL & AUTOPART CO.,LTD.
      </div>
    </div>
  );
}
