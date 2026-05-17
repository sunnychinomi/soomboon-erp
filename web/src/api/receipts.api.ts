import { apiClient } from './client';
import type {
  PagedResult, PagingQuery,
  ReceiptListItem, CreateReceiptInput, PaymentMethod,
} from './types';

export const receiptsApi = {
  list: (q: PagingQuery & {
    customerId?: string;
    method?: PaymentMethod;
    from?: string;
    to?: string;
  } = {}) =>
    apiClient.get<PagedResult<ReceiptListItem>>('/receipts', { params: q }).then((r) => r.data),
  create: (data: CreateReceiptInput) =>
    apiClient.post<ReceiptListItem>('/receipts', data).then((r) => r.data),
};
