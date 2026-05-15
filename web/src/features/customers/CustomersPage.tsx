import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { customersApi } from '@/api/customers.api';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input, Field } from '@/components/ui/Input';
import { Pill } from '@/components/ui/Pill';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { toast } from '@/components/ui/Toast';
import { fmt } from '@/lib/utils';
import type { CustomerListItem, CustomerInput, CustomerDetail } from '@/api/types';

const schema = z.object({
  code: z.string().min(1, 'ระบุรหัส').max(50),
  name: z.string().min(1, 'ระบุชื่อ').max(200),
  type: z.enum(['Individual', 'Company']),
  grade: z.enum(['A', 'B', 'C']),
  contactName: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email('อีเมลไม่ถูกต้อง').optional().or(z.literal('')).or(z.null()),
  address: z.string().optional().nullable(),
  taxId: z.string().optional().nullable(),
  creditTerms: z.string().optional().nullable(),
  creditLimit: z.coerce.number().min(0),
  isActive: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

export default function CustomersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<CustomerDetail | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['customers', { page, search }],
    queryFn: () => customersApi.list({ page, pageSize: 20, search }),
  });

  const createMut = useMutation({
    mutationFn: (d: CustomerInput) => customersApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customers'] }); toast.success('เพิ่มลูกค้าเรียบร้อย'); setOpenForm(false); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'เพิ่มไม่สำเร็จ'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Omit<CustomerInput, 'code'> }) => customersApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customers'] }); toast.success('แก้ไขเรียบร้อย'); setEditing(null); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'แก้ไขไม่สำเร็จ'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => customersApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customers'] }); toast.success('ลบเรียบร้อย'); setDeleteId(null); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'ลบไม่สำเร็จ'),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: editing ? {
      code: editing.code, name: editing.name, type: editing.type, grade: editing.grade,
      contactName: editing.contactName, phone: editing.phone, email: editing.email,
      address: editing.address, taxId: editing.taxId, creditTerms: editing.creditTerms,
      creditLimit: editing.creditLimit, isActive: editing.isActive,
    } : { code: '', name: '', type: 'Individual', grade: 'C', creditLimit: 0, isActive: true } as FormData,
  });

  const onSubmit = handleSubmit(async (data) => {
    const payload: CustomerInput = { ...data, email: data.email || null };
    if (editing) {
      const { code: _, ...rest } = payload;
      await updateMut.mutateAsync({ id: editing.id, data: rest });
    } else {
      await createMut.mutateAsync(payload);
    }
    reset();
  });

  const columns: Column<CustomerListItem>[] = [
    { key: 'code', header: 'รหัส', width: '90px', render: (c) => <span className="font-mono text-xs">{c.code}</span> },
    {
      key: 'name', header: 'ชื่อลูกค้า', render: (c) => (
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg grid place-items-center font-mono text-[10px] border border-rule flex-none ${c.grade === 'A' ? 'bg-gold-glow text-gold-dark' : c.grade === 'B' ? 'bg-steel-glow text-indigo' : 'bg-paper-2 text-mute'}`}>
            {c.name.substring(0, 2)}
          </div>
          <div>
            <div className="font-medium text-[13px]">{c.name}</div>
            {c.contactName && <div className="text-[11px] text-mute mt-0.5">{c.contactName}</div>}
          </div>
        </div>
      ),
    },
    { key: 'type', header: 'ประเภท', render: (c) => <span className="text-mute text-xs">{c.type === 'Company' ? 'นิติบุคคล' : 'บุคคลธรรมดา'}</span> },
    { key: 'grade', header: 'เกรด', render: (c) => <Pill variant={c.grade === 'A' ? 'gold' : c.grade === 'B' ? 'info' : 'muted'}>{c.grade} · {c.grade === 'A' ? 'VIP' : c.grade === 'B' ? 'ทั่วไป' : 'ใหม่'}</Pill> },
    { key: 'phone', header: 'เบอร์', render: (c) => <span className="font-mono text-xs">{c.phone || '—'}</span> },
    { key: 'credit', header: 'วงเงินเครดิต', align: 'right', render: (c) => <span className="font-mono">{c.creditLimit > 0 ? `฿${fmt.money(c.creditLimit)}` : '—'}</span> },
    {
      key: 'actions', header: '', align: 'right', width: '100px', render: (c) => (
        <div className="flex justify-end gap-1">
          <button onClick={async () => setEditing(await customersApi.get(c.id))} className="w-8 h-8 rounded grid place-items-center text-mute hover:bg-paper-2 hover:text-ink">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setDeleteId(c.id)} className="w-8 h-8 rounded grid place-items-center text-mute hover:bg-burgundy-soft hover:text-burgundy">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="การขาย · ลูกค้า"
        title="ทะเบียน"
        em="ลูกค้า"
        desc="บัญชีลูกค้าทั้งหมดพร้อมเกรด VIP และวงเงินเครดิต"
        actions={<Button variant="rust" onClick={() => { reset(); setOpenForm(true); }}><Plus className="w-3.5 h-3.5" /> เพิ่มลูกค้า</Button>}
      />

      <div className="bg-white border border-rule rounded-xl p-4 mb-5 flex gap-3 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-mute" />
          <Input placeholder="ค้นหาชื่อ, รหัส, เบอร์โทร..." className="pl-10" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div className="text-xs font-mono text-mute tracking-wider">{data ? `${data.total} ลูกค้า` : '—'}</div>
      </div>

      <DataTable columns={columns} rows={data?.items || []} loading={isLoading}
        pagination={{ page, pageSize: 20, total: data?.total || 0, onPageChange: setPage }} />

      <Modal
        open={openForm || !!editing}
        onClose={() => { setOpenForm(false); setEditing(null); reset(); }}
        title={editing ? 'แก้ไขลูกค้า' : 'เพิ่มลูกค้าใหม่'}
        size="lg"
        footer={<>
          <Button onClick={() => { setOpenForm(false); setEditing(null); reset(); }}>ยกเลิก</Button>
          <Button variant="primary" onClick={onSubmit} disabled={createMut.isPending || updateMut.isPending}>
            {createMut.isPending || updateMut.isPending ? 'กำลังบันทึก...' : 'บันทึก'}
          </Button>
        </>}
      >
        <form onSubmit={onSubmit} className="grid grid-cols-2 gap-5">
          <Field label="รหัสลูกค้า">
            <Input {...register('code')} disabled={!!editing} placeholder="C001" />
            {errors.code && <span className="text-xs text-rust mt-1">{errors.code.message}</span>}
          </Field>
          <Field label="ประเภท">
            <select {...register('type')} className="w-full px-3 py-2.5 border border-rule-strong rounded-lg text-sm focus:outline-none focus:border-ink">
              <option value="Individual">บุคคลธรรมดา</option>
              <option value="Company">นิติบุคคล</option>
            </select>
          </Field>
          <Field label="ชื่อ" className="col-span-2">
            <Input {...register('name')} />
            {errors.name && <span className="text-xs text-rust mt-1">{errors.name.message}</span>}
          </Field>
          <Field label="ผู้ติดต่อ"><Input {...register('contactName')} /></Field>
          <Field label="เบอร์โทร"><Input {...register('phone')} /></Field>
          <Field label="อีเมล"><Input type="email" {...register('email')} /></Field>
          <Field label="เลขผู้เสียภาษี"><Input {...register('taxId')} /></Field>
          <Field label="ที่อยู่" className="col-span-2"><Input {...register('address')} /></Field>
          <Field label="เกรด">
            <select {...register('grade')} className="w-full px-3 py-2.5 border border-rule-strong rounded-lg text-sm focus:outline-none focus:border-ink">
              <option value="A">A · VIP</option>
              <option value="B">B · ทั่วไป</option>
              <option value="C">C · ใหม่</option>
            </select>
          </Field>
          <Field label="เงื่อนไขเครดิต"><Input {...register('creditTerms')} placeholder="30 วัน, เงินสด" /></Field>
          <Field label="วงเงินเครดิต (฿)" className="col-span-2">
            <Input type="number" step="0.01" {...register('creditLimit')} />
          </Field>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        message="ต้องการลบลูกค้านี้ออกจากระบบใช่หรือไม่?"
        danger confirmText="ลบลูกค้า"
        loading={deleteMut.isPending}
        onConfirm={() => deleteMut.mutate(deleteId!)}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}
