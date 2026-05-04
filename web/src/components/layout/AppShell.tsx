import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="grid grid-cols-[248px_1fr] grid-rows-[60px_1fr] h-screen bg-paper">
      <div className="row-span-2"><Sidebar /></div>
      <Topbar />
      <main className="overflow-y-auto bg-paper">
        <div className="px-9 py-7 max-w-[1480px] mx-auto pb-16">{children}</div>
      </main>
    </div>
  );
}
