import { Home, Box, Grid3x3, Users, Truck, Building2, BadgeCheck, History, ShoppingCart, Inbox, Tag, Receipt, Star, FileText } from 'lucide-react';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { useAuthStore } from '@/store/auth.store';
import { useRoute, type Route } from '@/lib/router';
import { cn } from '@/lib/utils';

interface NavItem {
  key: Route;
  label: string;
  Icon: typeof Home;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const NAV: NavSection[] = [
  { label: 'หลัก', items: [{ key: 'dashboard', label: 'แดชบอร์ด', Icon: Home }] },
  { label: 'คลังสินค้า', items: [
    { key: 'inventory/stock', label: 'สต็อกสินค้า', Icon: Box },
    { key: 'inventory/product', label: 'รายการสินค้า', Icon: Grid3x3 },
    { key: 'inventory/movements', label: 'ประวัติการเคลื่อนไหว', Icon: History },
  ]},
  { label: 'จัดซื้อ', items: [
    { key: 'purchase/po', label: 'ใบสั่งซื้อ', Icon: ShoppingCart },
    { key: 'purchase/receiving', label: 'รับสินค้า', Icon: Inbox },
    { key: 'purchase/vendor', label: 'ผู้ขาย', Icon: Truck },
  ]},
  { label: 'การขาย', items: [
    { key: 'sales/so', label: 'ใบขาย/ใบกำกับภาษี', Icon: Tag },
    { key: 'sales/receipt', label: 'ใบเสร็จรับเงิน', Icon: Receipt },
    { key: 'sales/customer', label: 'ลูกค้า', Icon: Users },
    { key: 'sales/promotion', label: 'โปรโมชัน', Icon: Star },
    { key: 'sales/credit-note', label: 'ใบลดหนี้', Icon: FileText },
  ]},
  { label: 'ผู้ดูแลระบบ', items: [
    { key: 'admin/branch', label: 'สาขา', Icon: Building2 },
    { key: 'admin/employee', label: 'พนักงาน', Icon: BadgeCheck },
  ]},
];

export function Sidebar() {
  const { user } = useAuthStore();
  const [route, navigate] = useRoute();

  return (
    <aside className="bg-indigo text-white/85 flex flex-col overflow-y-auto w-[248px]">
      <div className="p-5 border-b border-white/10 flex flex-col items-center">
        <BrandLogo width={180} />
        <div className="font-mono text-[9px] tracking-[0.16em] text-white/35 text-center mt-3">
          ENTERPRISE v3.0
        </div>
      </div>

      <nav className="py-3 flex-1">
        {NAV.map((g) => (
          <div key={g.label} className="py-2">
            <div className="px-5 pb-1.5 font-mono text-[9px] tracking-[0.2em] uppercase text-white/35">
              {g.label}
            </div>
            {g.items.map((item) => {
              const active = route === item.key;
              return (
                <a
                  key={item.key}
                  onClick={(e) => { e.preventDefault(); navigate(item.key); }}
                  className={cn(
                    'flex items-center gap-3 px-5 py-2 cursor-pointer text-[13px] border-l-2 transition-all',
                    active
                      ? 'text-white bg-gradient-to-r from-rust/20 to-transparent border-rust'
                      : 'text-white/70 border-transparent hover:text-white hover:bg-white/5'
                  )}
                >
                  <item.Icon className={cn('w-3.5 h-3.5', active ? 'text-gold-soft' : 'opacity-65')} />
                  <span className="flex-1">{item.label}</span>
                </a>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="p-5 border-t border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold to-rust grid place-items-center text-white font-display font-semibold text-sm">
            {user?.fullName?.charAt(0) || user?.username?.charAt(0) || '?'}
          </div>
          <div className="text-xs leading-tight min-w-0 flex-1">
            <div className="text-white font-medium truncate">
              {user?.fullName || user?.username}
            </div>
            <div className="text-white/50 font-mono text-[10px] tracking-wider">
              {user?.roles?.[0]?.toUpperCase() || 'USER'}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
