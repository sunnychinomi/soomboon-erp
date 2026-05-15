import { apiClient } from './client';
import type { PagedResult, PagingQuery, Employee, EmployeeInput } from './types';

export const employeesApi = {
  list: (q: PagingQuery & { branchId?: string } = {}) =>
    apiClient.get<PagedResult<Employee>>('/employees', { params: q }).then((r) => r.data),
  get: (id: string) =>
    apiClient.get<Employee>(`/employees/${id}`).then((r) => r.data),
  create: (data: EmployeeInput) =>
    apiClient.post<Employee>('/employees', data).then((r) => r.data),
  update: (id: string, data: Omit<EmployeeInput, 'code'>) =>
    apiClient.put<Employee>(`/employees/${id}`, data).then((r) => r.data),
  delete: (id: string) =>
    apiClient.delete(`/employees/${id}`).then(() => undefined),
};
