import { apiClient } from './client';
import type { PagedResult, PagingQuery, ProductDetail, ProductInput, ProductListItem } from './types';

export const productsApi = {
  list: (q: PagingQuery = {}) =>
    apiClient.get<PagedResult<ProductListItem>>('/products', { params: q }).then((r) => r.data),
  get: (id: string) =>
    apiClient.get<ProductDetail>(`/products/${id}`).then((r) => r.data),
  create: (data: ProductInput) =>
    apiClient.post<ProductDetail>('/products', data).then((r) => r.data),
  update: (id: string, data: Omit<ProductInput, 'code'>) =>
    apiClient.put<ProductDetail>(`/products/${id}`, data).then((r) => r.data),
  delete: (id: string) =>
    apiClient.delete(`/products/${id}`).then(() => undefined),
};
