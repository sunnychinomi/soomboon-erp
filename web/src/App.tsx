import { useAuthStore } from './store/auth.store';
import { useRoute } from './lib/router';
import LoginPage from './features/auth/LoginPage';
import AppShell from './components/layout/AppShell';
import DashboardPage from './features/dashboard/DashboardPage';
import ProductsPage from './features/products/ProductsPage';
import StockPage from './features/inventory/StockPage';
import StockMovementsPage from './features/inventory/StockMovementsPage';
import PurchaseOrdersPage from './features/purchase/PurchaseOrdersPage';
import ReceivingsPage from './features/purchase/ReceivingsPage';
import SalesOrdersPage from './features/sales/SalesOrdersPage';
import ReceiptsPage from './features/sales/ReceiptsPage';
import PromotionsPage from './features/sales/PromotionsPage';
import CreditNotesPage from './features/sales/CreditNotesPage';
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
      case 'inventory/stock':     return <StockPage />;
      case 'inventory/product':   return <ProductsPage />;
      case 'inventory/movements': return <StockMovementsPage />;
      case 'purchase/po':         return <PurchaseOrdersPage />;
      case 'purchase/receiving':  return <ReceivingsPage />;
      case 'purchase/vendor':     return <VendorsPage />;
      case 'sales/so':            return <SalesOrdersPage />;
      case 'sales/receipt':       return <ReceiptsPage />;
      case 'sales/promotion':     return <PromotionsPage />;
      case 'sales/credit-note':   return <CreditNotesPage />;
      case 'sales/customer':      return <CustomersPage />;
      case 'admin/branch':        return <BranchesPage />;
      case 'admin/employee':      return <EmployeesPage />;
      default:                    return <DashboardPage />;
    }
  };

  return (
    <>
      <AppShell>{renderPage()}</AppShell>
      <Toaster />
    </>
  );
}
