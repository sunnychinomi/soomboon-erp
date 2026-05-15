import type { ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow?: string;
  title: ReactNode;
  em?: string;
  desc?: string;
  actions?: ReactNode;
}

export function PageHeader({ eyebrow, title, em, desc, actions }: PageHeaderProps) {
  return (
    <div className="flex items-end justify-between pb-5 border-b border-rule mb-7 gap-6 flex-wrap">
      <div>
        {eyebrow && (
          <div className="flex items-center gap-2 font-mono text-[10.5px] tracking-[0.18em] uppercase text-rust mb-2">
            <span className="w-4 h-px bg-rust" />
            {eyebrow}
          </div>
        )}
        <h1 className="font-display font-medium text-[34px] leading-tight tracking-tight">
          {title}
          {em && <> <em className="font-serif italic font-normal text-rust">{em}</em></>}
        </h1>
        {desc && <p className="mt-2 text-mute text-sm max-w-xl">{desc}</p>}
      </div>
      {actions && <div className="flex gap-2.5 flex-wrap">{actions}</div>}
    </div>
  );
}
