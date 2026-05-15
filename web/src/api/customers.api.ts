import { apiClient } from './client';
import type { PagedResult, PagingQuery, CustomerDetail, CustomerInput, CustomerListItem } from './types';

export const customersApi = {
  list: (q: PagingQuery = {}) =>
    apiClient.get<PagedResult<CustomerListItem>>('/customers', { params: q }).then((r) => r.data),
  get: (id: string) =>
    apiClient.get<CustomerDetail>(`/customers/${id}`).then((r) => r.data),
  create: (data: CustomerInput) =>
    apiClient.post<CustomerDetail>('/customers', data).then((r) => r.data),
  update: (id: string, data: Omit<CustomerInput, 'code'>) =>
    apiClient.put<CustomerDetail>(`/customers/${id}`, data).then((r) => r.data),
  delete: (id: string) =>
    apiClient.delete(`/customers/${id}`).then(() => undefined),
};
