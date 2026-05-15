import { apiClient } from './client';
import type { PagedResult, PagingQuery, VendorDetail, VendorInput, VendorListItem } from './types';

export const vendorsApi = {
  list: (q: PagingQuery = {}) =>
    apiClient.get<PagedResult<VendorListItem>>('/vendors', { params: q }).then((r) => r.data),
  get: (id: string) =>
    apiClient.get<VendorDetail>(`/vendors/${id}`).then((r) => r.data),
  create: (data: VendorInput) =>
    apiClient.post<VendorDetail>('/vendors', data).then((r) => r.data),
  update: (id: string, data: Omit<VendorInput, 'code'>) =>
    apiClient.put<VendorDetail>(`/vendors/${id}`, data).then((r) => r.data),
  delete: (id: string) =>
    apiClient.delete(`/vendors/${id}`).then(() => undefined),
};
