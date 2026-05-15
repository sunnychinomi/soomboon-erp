import { apiClient } from './client';
import type {
  PagedResult, PagingQuery,
  StockListItem, AdjustStockInput, StockStatus,
  StockMovement, MovementDirection,
} from './types';

export const stocksApi = {
  list: (q: PagingQuery & { branchId?: string; status?: StockStatus } = {}) =>
    apiClient.get<PagedResult<StockListItem>>('/stocks', { params: q }).then((r) => r.data),
  byProduct: (productId: string) =>
    apiClient.get<StockListItem[]>(`/stocks/by-product/${productId}`).then((r) => r.data),
  adjust: (data: AdjustStockInput) =>
    apiClient.post<StockListItem>('/stocks/adjust', data).then((r) => r.data),
};

export const stockMovementsApi = {
  list: (q: PagingQuery & {
    productId?: string;
    branchId?: string;
    direction?: MovementDirection;
    from?: string;
    to?: string;
  } = {}) =>
    apiClient.get<PagedResult<StockMovement>>('/stock-movements', { params: q }).then((r) => r.data),
};
