import { useAuthStore } from './store/auth.store';
import { useRoute } from './lib/router';
import LoginPage from './features/auth/LoginPage';
import AppShell from './components/layout/AppShell';
import DashboardPage from './features/dashboard/DashboardPage';
import ProductsPage from './features/products/ProductsPage';
import CustomersPage from './features/customers/CustomersPage';
import VendorsPage from './features/vendors/VendorsPage';
import BranchesPage from './features/branches/BranchesPage';
import EmployeesPage from './features/employees/EmployeesPage';
import { Toaster } from './components/ui/Toast';

export default function App() {
  const { user } = useAuthStore();
  const [route] = useRoute();

  if (!user) {
    return (
      <>
        <LoginPage />
        <Toaster />
      </>
    );
  }

  const renderPage = () => {
    switch (route) {
      case 'inventory/product': return <ProductsPage />;
      case 'sales/customer':    return <CustomersPage />;
      case 'purchase/vendor':   return <VendorsPage />;
      case 'admin/branch':      return <BranchesPage />;
      case 'admin/employee':    return <EmployeesPage />;
      default:                  return <DashboardPage />;
    }
  };

  return (
    <>
      <AppShell>{renderPage()}</AppShell>
      <Toaster />
    </>
  );
}
