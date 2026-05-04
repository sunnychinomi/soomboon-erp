import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export function LangSwitch() {
  const { i18n } = useTranslation();

  const change = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('lang', lng);
  };

  return (
    <div className="inline-flex bg-paper-2 rounded-full p-0.5 text-[11px] font-mono tracking-wider">
      {(['th', 'en'] as const).map((l) => (
        <button
          key={l}
          onClick={() => change(l)}
          className={cn(
            'px-3 py-1 rounded-full font-medium transition-all',
            i18n.language === l ? 'bg-ink text-white' : 'text-mute'
          )}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
