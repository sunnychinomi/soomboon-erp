import { create } from 'zustand';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastVariant = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  variant: ToastVariant;
  message: string;
}

interface ToastStore {
  items: ToastItem[];
  show: (message: string, variant?: ToastVariant) => void;
  remove: (id: number) => void;
}

let nextId = 0;

const useToastStore = create<ToastStore>((set) => ({
  items: [],
  show: (message, variant = 'info') => {
    const id = ++nextId;
    set((s) => ({ items: [...s.items, { id, variant, message }] }));
    setTimeout(() => {
      set((s) => ({ items: s.items.filter((i) => i.id !== id) }));
    }, 4000);
  },
  remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
}));

export const toast = {
  success: (msg: string) => useToastStore.getState().show(msg, 'success'),
  error:   (msg: string) => useToastStore.getState().show(msg, 'error'),
  info:    (msg: string) => useToastStore.getState().show(msg, 'info'),
};

export function Toaster() {
  const { items, remove } = useToastStore();
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2.5 max-w-sm">
      {items.map((t) => (
        <div
          key={t.id}
          className={cn(
            'flex items-start gap-3 px-4 py-3 rounded-lg shadow-card-lg border bg-white animate-fade-up',
            t.variant === 'success' && 'border-green-200',
            t.variant === 'error' && 'border-burgundy/30',
            t.variant === 'info' && 'border-indigo/20',
          )}
        >
          {t.variant === 'success' && <CheckCircle2 className="w-5 h-5 text-green-600 flex-none mt-0.5" />}
          {t.variant === 'error' && <AlertCircle className="w-5 h-5 text-burgundy flex-none mt-0.5" />}
          {t.variant === 'info' && <Info className="w-5 h-5 text-indigo flex-none mt-0.5" />}
          <p className="flex-1 text-sm leading-snug">{t.message}</p>
          <button onClick={() => remove(t.id)} className="text-mute hover:text-ink flex-none">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
