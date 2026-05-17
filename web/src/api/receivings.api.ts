import { apiClient } from './client';
import type {
  PagedResult, PagingQuery,
  ReceivingListItem, ReceivingDetail, CreateReceivingInput,
} from './types';

export const receivingsApi = {
  list: (q: PagingQuery & {
    vendorId?: string;
    branchId?: string;
    from?: string;
    to?: string;
  } = {}) =>
    apiClient.get<PagedResult<ReceivingListItem>>('/receivings', { params: q }).then((r) => r.data),
  get: (id: string) =>
    apiClient.get<ReceivingDetail>(`/receivings/${id}`).then((r) => r.data),
  create: (data: CreateReceivingInput) =>
    apiClient.post<ReceivingDetail>('/receivings', data).then((r) => r.data),
};
