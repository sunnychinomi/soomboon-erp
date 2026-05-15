import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '@/api/products.api';
import type { PagingQuery, ProductInput } from '@/api/types';
import { toast } from '@/components/ui/Toast';

const KEY = 'products';

export function useProducts(query: PagingQuery) {
  return useQuery({
    queryKey: [KEY, query],
    queryFn: () => productsApi.list(query),
  });
}

export function useProduct(id: string | null) {
  return useQuery({
    queryKey: [KEY, id],
    queryFn: () => productsApi.get(id!),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ProductInput) => productsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
      toast.success('เพิ่มสินค้าเรียบร้อย');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'เพิ่มสินค้าไม่สำเร็จ'),
  });
}

export function useUpdateProduct(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<ProductInput, 'code'>) => productsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
      toast.success('แก้ไขสินค้าเรียบร้อย');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'แก้ไขไม่สำเร็จ'),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
      toast.success('ลบสินค้าเรียบร้อย');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'ลบไม่สำเร็จ'),
  });
}
