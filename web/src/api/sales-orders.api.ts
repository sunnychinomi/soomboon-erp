import { apiClient } from './client';
import type {
  PagedResult, PagingQuery,
  SalesOrderListItem, SalesOrderDetail, CreateSalesOrderInput, SalesOrderStatus,
} from './types';

export const salesOrdersApi = {
  list: (q: PagingQuery & {
    status?: SalesOrderStatus;
    customerId?: string;
    from?: string;
    to?: string;
  } = {}) =>
    apiClient.get<PagedResult<SalesOrderListItem>>('/sales-orders', { params: q }).then((r) => r.data),
  get: (id: string) =>
    apiClient.get<SalesOrderDetail>(`/sales-orders/${id}`).then((r) => r.data),
  create: (data: CreateSalesOrderInput) =>
    apiClient.post<SalesOrderDetail>('/sales-orders', data).then((r) => r.data),
  cancel: (id: string) =>
    apiClient.post(`/sales-orders/${id}/cancel`).then(() => undefined),
};
