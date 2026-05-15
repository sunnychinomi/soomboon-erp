import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { vendorsApi } from '@/api/vendors.api';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input, Field } from '@/components/ui/Input';
import { Pill } from '@/components/ui/Pill';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { toast } from '@/components/ui/Toast';
import type { VendorListItem, VendorInput, VendorDetail } from '@/api/types';

const schema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  contactName: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal('')).or(z.null()),
  address: z.string().optional().nullable(),
  taxId: z.string().optional().nullable(),
  paymentTerms: z.string().min(1),
  isActive: z.boolean().optional(),
});
type FormData = z.infer<typeof schema>;

export default function VendorsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<VendorDetail | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['vendors', { page, search }],
    queryFn: () => vendorsApi.list({ page, pageSize: 20, search }),
  });

  const createMut = useMutation({
    mutationFn: (d: VendorInput) => vendorsApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vendors'] }); toast.success('เพิ่มผู้ขายเรียบร้อย'); setOpenForm(false); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'ไม่สำเร็จ'),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Omit<VendorInput, 'code'> }) => vendorsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vendors'] }); toast.success('แก้ไขเรียบร้อย'); setEditing(null); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'ไม่สำเร็จ'),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => vendorsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vendors'] }); toast.success('ลบเรียบร้อย'); setDeleteId(null); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'ไม่สำเร็จ'),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: editing ? {
      code: editing.code, name: editing.name, contactName: editing.contactName,
      phone: editing.phone, email: editing.email, address: editing.address,
      taxId: editing.taxId, paymentTerms: editing.paymentTerms, isActive: editing.isActive,
    } : { code: '', name: '', paymentTerms: '30 วัน', isActive: true } as FormData,
  });

  const onSubmit = handleSubmit(async (data) => {
    const payload: VendorInput = { ...data, email: data.email || null };
    if (editing) {
      const { code: _, ...rest } = payload;
      await updateMut.mutateAsync({ id: editing.id, data: rest });
    } else {
      await createMut.mutateAsync(payload);
    }
    reset();
  });

  const columns: Column<VendorListItem>[] = [
    { key: 'code', header: 'รหัส', width: '90px', render: (v) => <span className="font-mono text-xs">{v.code}</span> },
    {
      key: 'name', header: 'ชื่อผู้ขาย', render: (v) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-steel-glow to-steel-soft border border-rule grid place-items-center font-mono text-[10px] text-indigo flex-none">
            {v.name.substring(0, 2)}
          </div>
          <div>
            <div className="font-medium text-[13px]">{v.name}</div>
            {v.contactName && <div className="text-[11px] text-mute mt-0.5">{v.contactName}</div>}
          </div>
        </div>
      ),
    },
    { key: 'phone', header: 'เบอร์', render: (v) => <span className="font-mono text-xs">{v.phone || '—'}</span> },
    { key: 'payment', header: 'เครดิต', render: (v) => <Pill variant="muted">{v.paymentTerms}</Pill> },
    { key: 'products', header: 'สินค้า', align: 'right', render: (v) => <span className="font-mono">{v.productCount} รายการ</span> },
    {
      key: 'actions', header: '', align: 'right', width: '100px', render: (v) => (
        <div className="flex justify-end gap-1">
          <button onClick={async () => setEditing(await vendorsApi.get(v.id))} className="w-8 h-8 rounded grid place-items-center text-mute hover:bg-paper-2 hover:text-ink">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setDeleteId(v.id)} className="w-8 h-8 rounded grid place-items-center text-mute hover:bg-burgundy-soft hover:text-burgundy">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="จัดซื้อ · ผู้ขาย"
        title="ทะเบียน"
        em="ผู้ขาย"
        desc="ข้อมูลผู้ขายและซัพพลายเออร์ พร้อมเงื่อนไขชำระเงิน"
        actions={<Button variant="rust" onClick={() => { reset(); setOpenForm(true); }}><Plus className="w-3.5 h-3.5" /> เพิ่มผู้ขาย</Button>}
      />

      <div className="bg-white border border-rule rounded-xl p-4 mb-5 flex gap-3 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-mute" />
          <Input placeholder="ค้นหาชื่อ, รหัส, เบอร์โทร..." className="pl-10" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div className="text-xs font-mono text-mute tracking-wider">{data ? `${data.total} ผู้ขาย` : '—'}</div>
      </div>

      <DataTable columns={columns} rows={data?.items || []} loading={isLoading}
        pagination={{ page, pageSize: 20, total: data?.total || 0, onPageChange: setPage }} />

      <Modal
        open={openForm || !!editing}
        onClose={() => { setOpenForm(false); setEditing(null); reset(); }}
        title={editing ? 'แก้ไขผู้ขาย' : 'เพิ่มผู้ขายใหม่'}
        size="md"
        footer={<>
          <Button onClick={() => { setOpenForm(false); setEditing(null); reset(); }}>ยกเลิก</Button>
          <Button variant="primary" onClick={onSubmit} disabled={createMut.isPending || updateMut.isPending}>
            {createMut.isPending || updateMut.isPending ? 'กำลังบันทึก...' : 'บันทึก'}
          </Button>
        </>}
      >
        <form onSubmit={onSubmit} className="grid grid-cols-2 gap-5">
          <Field label="รหัสผู้ขาย">
            <Input {...register('code')} disabled={!!editing} placeholder="V001" />
            {errors.code && <span className="text-xs text-rust mt-1">{errors.code.message}</span>}
          </Field>
          <Field label="เครดิต">
            <Input {...register('paymentTerms')} placeholder="30 วัน, เงินสด..." />
          </Field>
          <Field label="ชื่อผู้ขาย" className="col-span-2">
            <Input {...register('name')} />
            {errors.name && <span className="text-xs text-rust mt-1">{errors.name.message}</span>}
          </Field>
          <Field label="ผู้ติดต่อ"><Input {...register('contactName')} /></Field>
          <Field label="เบอร์โทร"><Input {...register('phone')} /></Field>
          <Field label="อีเมล"><Input type="email" {...register('email')} /></Field>
          <Field label="เลขผู้เสียภาษี"><Input {...register('taxId')} /></Field>
          <Field label="ที่อยู่" className="col-span-2"><Input {...register('address')} /></Field>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        message="ต้องการลบผู้ขายนี้ใช่หรือไม่? (จะลบไม่ได้ถ้ายังมีสินค้าผูกอยู่)"
        danger confirmText="ลบผู้ขาย"
        loading={deleteMut.isPending}
        onConfirm={() => deleteMut.mutate(deleteId!)}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}
