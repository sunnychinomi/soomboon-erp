import { Bell, Search, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LangSwitch } from '@/components/ui/LangSwitch';
import { useAuthStore } from '@/store/auth.store';

export function Topbar() {
  const { t } = useTranslation();
  const logout = useAuthStore((s) => s.logout);

  return (
    <header className="bg-white border-b border-rule flex items-center px-7 gap-5 h-[60px]">
      <div className="font-mono text-[10.5px] tracking-[0.12em] text-mute uppercase">
        S.ARAN <span className="opacity-40 mx-1.5">/</span>
        <span className="text-ink">{t('nav.dashboard')}</span>
      </div>
      <div className="flex-1 max-w-[400px] relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-mute" />
        <input
          type="text"
          placeholder="ค้นหาสินค้า, ลูกค้า, เอกสาร..."
          className="w-full pl-10 pr-3 py-2 border border-rule rounded-lg bg-paper-2 text-sm focus:outline-none focus:border-ink focus:bg-white"
        />
      </div>
      <div className="ml-auto flex items-center gap-2.5">
        <LangSwitch />
        <button className="relative w-9 h-9 border border-rule rounded-lg grid place-items-center text-ink-2 hover:bg-paper">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rust border-2 border-white"></span>
        </button>
        <button
          onClick={logout}
          className="w-9 h-9 border border-rule rounded-lg grid place-items-center text-ink-2 hover:bg-paper"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
