import { apiClient } from './client';
import type {
  PagedResult, PagingQuery,
  PurchaseOrderListItem, PurchaseOrderDetail, CreatePurchaseOrderInput, PoStatus,
} from './types';

export const purchaseOrdersApi = {
  list: (q: PagingQuery & {
    status?: PoStatus;
    vendorId?: string;
    from?: string;
    to?: string;
  } = {}) =>
    apiClient.get<PagedResult<PurchaseOrderListItem>>('/purchase-orders', { params: q }).then((r) => r.data),
  get: (id: string) =>
    apiClient.get<PurchaseOrderDetail>(`/purchase-orders/${id}`).then((r) => r.data),
  create: (data: CreatePurchaseOrderInput) =>
    apiClient.post<PurchaseOrderDetail>('/purchase-orders', data).then((r) => r.data),
  update: (id: string, data: CreatePurchaseOrderInput) =>
    apiClient.put<PurchaseOrderDetail>(`/purchase-orders/${id}`, data).then((r) => r.data),
  cancel: (id: string) =>
    apiClient.post(`/purchase-orders/${id}/cancel`).then(() => undefined),
};
