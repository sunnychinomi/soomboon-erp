import { useEffect, useState } from 'react';

export type Route =
  | 'dashboard'
  | 'inventory/product'
  | 'sales/customer'
  | 'purchase/vendor'
  | 'admin/branch'
  | 'admin/employee';

export function useRoute(): [Route, (r: Route) => void] {
  const [route, setRoute] = useState<Route>(() => {
    const hash = window.location.hash.slice(2);
    return (hash || 'dashboard') as Route;
  });

  useEffect(() => {
    const handler = () => {
      const hash = window.location.hash.slice(2);
      setRoute((hash || 'dashboard') as Route);
    };
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const navigate = (r: Route) => {
    window.location.hash = `#/${r}`;
  };

  return [route, navigate];
}
