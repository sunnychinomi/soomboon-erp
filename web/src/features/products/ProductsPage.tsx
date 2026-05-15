import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Download } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Pill } from '@/components/ui/Pill';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ProductForm } from './ProductForm';
import { useProducts, useProduct, useCreateProduct, useUpdateProduct, useDeleteProduct } from './useProducts';
import { fmt } from '@/lib/utils';
import type { ProductListItem } from '@/api/types';

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editId, setEditId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useProducts({ page, pageSize: 20, search });
  const { data: editing } = useProduct(editId);
  const createMut = useCreateProduct();
  const updateMut = useUpdateProduct(editId || '');
  const deleteMut = useDeleteProduct();

  const columns: Column<ProductListItem>[] = [
    {
      key: 'code',
      header: 'รหัส',
      width: '110px',
      render: (p) => <span className="font-mono text-xs text-mute">{p.code}</span>,
    },
    {
      key: 'name',
      header: 'สินค้า',
      render: (p) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-rust-soft to-rust-glow border border-rule grid place-items-center font-mono text-[10px] text-rust-dark flex-none">
            {p.name.substring(0, 2)}
          </div>
          <div>
            <div className="font-medium text-[13px]">{p.name}</div>
            <div className="text-[11px] text-mute font-mono mt-0.5">{p.brand || '—'}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'ประเภท',
      render: (p) => (
        <Pill variant={p.type === 'Genuine' ? 'gold' : 'muted'}>
          {p.type === 'Genuine' ? 'แท้' : 'เทียม'}
        </Pill>
      ),
    },
    {
      key: 'unit',
      header: 'หน่วย',
      render: (p) => <span className="text-mute text-xs">{p.unit}</span>,
    },
    {
      key: 'cost',
      header: 'ต้นทุน',
      align: 'right',
      render: (p) => <span className="font-mono">฿{fmt.money(p.cost)}</span>,
    },
    {
      key: 'price',
      header: 'ราคาขาย',
      align: 'right',
      render: (p) => <strong className="font-mono">฿{fmt.money(p.price)}</strong>,
    },
    {
      key: 'vendor',
      header: 'ผู้ขาย',
      render: (p) => <span className="text-[12.5px] text-mute">{p.primaryVendorName || '—'}</span>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '120px',
      render: (p) => (
        <div className="flex justify-end gap-1">
          <button onClick={() => setEditId(p.id)} className="w-8 h-8 rounded grid place-items-center text-mute hover:bg-paper-2 hover:text-ink transition-colors" title="แก้ไข">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setDeleteId(p.id)} className="w-8 h-8 rounded grid place-items-center text-mute hover:bg-burgundy-soft hover:text-burgundy transition-colors" title="ลบ">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="คลังสินค้า · Master Data"
        title="รายการ"
        em="สินค้า"
        desc="บัญชีรายการสินค้าทั้งหมดในระบบ พร้อมรายละเอียดและราคาจำหน่าย"
        actions={
          <>
            <Button><Download className="w-3.5 h-3.5" /> ส่งออก Excel</Button>
            <Button variant="rust" onClick={() => setAddOpen(true)}>
              <Plus className="w-3.5 h-3.5" /> เพิ่มสินค้าใหม่
            </Button>
          </>
        }
      />

      {/* Filter bar */}
      <div className="bg-white border border-rule rounded-xl p-4 mb-5 flex gap-3 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-mute" />
          <Input
            placeholder="ค้นหาสินค้า, รหัส, ยี่ห้อ..."
            className="pl-10"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="text-xs font-mono text-mute tracking-wider">
          {data ? `${data.total} รายการ` : '—'}
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        rows={data?.items || []}
        loading={isLoading}
        pagination={{
          page,
          pageSize: 20,
          total: data?.total || 0,
          onPageChange: setPage,
        }}
      />

      {/* Add Modal */}
      <ProductForm
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={async (data) => { await createMut.mutateAsync(data); }}
        loading={createMut.isPending}
      />

      {/* Edit Modal */}
      <ProductForm
        open={!!editId}
        onClose={() => setEditId(null)}
        onSubmit={async (data) => {
          const { code, ...rest } = data;
          await updateMut.mutateAsync(rest);
        }}
        initialData={editing}
        loading={updateMut.isPending}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteId}
        title="ยืนยันการลบสินค้า"
        message="ต้องการลบสินค้านี้ออกจากระบบใช่หรือไม่? การลบจะเป็นแบบ soft-delete สามารถกู้คืนได้"
        danger
        confirmText="ลบสินค้า"
        loading={deleteMut.isPending}
        onConfirm={async () => {
          await deleteMut.mutateAsync(deleteId!);
          setDeleteId(null);
        }}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}
