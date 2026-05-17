import { apiClient } from './client';
import type { Promotion, PromotionInput } from './types';

export const promotionsApi = {
  list: (activeOnly?: boolean) =>
    apiClient.get<Promotion[]>('/promotions', { params: { activeOnly } }).then((r) => r.data),
  get: (id: string) =>
    apiClient.get<Promotion>(`/promotions/${id}`).then((r) => r.data),
  create: (data: PromotionInput) =>
    apiClient.post<Promotion>('/promotions', data).then((r) => r.data),
  update: (id: string, data: Omit<PromotionInput, 'code'>) =>
    apiClient.put<Promotion>(`/promotions/${id}`, data).then((r) => r.data),
  delete: (id: string) =>
    apiClient.delete(`/promotions/${id}`).then(() => undefined),
};
