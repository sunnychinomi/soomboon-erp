import { useAuthStore } from './store/auth.store';
import LoginPage from './features/auth/LoginPage';
import AppShell from './components/layout/AppShell';
import DashboardPage from './features/dashboard/DashboardPage';

export default function App() {
  const { user } = useAuthStore();

  if (!user) {
    return <LoginPage />;
  }

  return (
    <AppShell>
      <DashboardPage />
    </AppShell>
  );
}
