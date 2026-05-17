import { apiClient } from './client';
import type {
  PagedResult, PagingQuery,
  CreditNoteListItem, CreateCreditNoteInput,
} from './types';

export const creditNotesApi = {
  list: (q: PagingQuery & {
    customerId?: string;
    from?: string;
    to?: string;
  } = {}) =>
    apiClient.get<PagedResult<CreditNoteListItem>>('/credit-notes', { params: q }).then((r) => r.data),
  create: (data: CreateCreditNoteInput) =>
    apiClient.post<CreditNoteListItem>('/credit-notes', data).then((r) => r.data),
};
