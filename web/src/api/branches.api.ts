import { apiClient } from './client';
import type { Branch, BranchInput } from './types';

export const branchesApi = {
  list: (search?: string) =>
    apiClient.get<Branch[]>('/branches', { params: { search } }).then((r) => r.data),
  get: (id: string) =>
    apiClient.get<Branch>(`/branches/${id}`).then((r) => r.data),
  create: (data: BranchInput) =>
    apiClient.post<Branch>('/branches', data).then((r) => r.data),
  update: (id: string, data: Omit<BranchInput, 'code'>) =>
    apiClient.put<Branch>(`/branches/${id}`, data).then((r) => r.data),
  delete: (id: string) =>
    apiClient.delete(`/branches/${id}`).then(() => undefined),
};
