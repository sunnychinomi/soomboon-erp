import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { employeesApi } from '@/api/employees.api';
import { branchesApi } from '@/api/branches.api';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input, Field } from '@/components/ui/Input';
import { Pill } from '@/components/ui/Pill';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { toast } from '@/components/ui/Toast';
import type { Employee, EmployeeInput } from '@/api/types';

const schema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(200),
  position: z.string().optional().nullable(),
  branchId: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal('')).or(z.null()),
  isActive: z.boolean().optional(),
});
type FormData = z.infer<typeof schema>;

export default function EmployeesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['employees', { page, search }],
    queryFn: () => employeesApi.list({ page, pageSize: 20, search }),
  });
  const { data: branches } = useQuery({ queryKey: ['branches'], queryFn: () => branchesApi.list() });

  const createMut = useMutation({
    mutationFn: (d: EmployeeInput) => employeesApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employees'] }); toast.success('เพิ่มพนักงานเรียบร้อย'); setOpenForm(false); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'ไม่สำเร็จ'),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Omit<EmployeeInput, 'code'> }) => employeesApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employees'] }); toast.success('แก้ไขเรียบร้อย'); setEditing(null); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'ไม่สำเร็จ'),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => employeesApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employees'] }); toast.success('ลบเรียบร้อย'); setDeleteId(null); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'ไม่สำเร็จ'),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: editing ? {
      code: editing.code, name: editing.name, position: editing.position,
      branchId: editing.branchId, phone: editing.phone, email: editing.email, isActive: editing.isActive,
    } : { code: '', name: '', isActive: true } as FormData,
  });

  const onSubmit = handleSubmit(async (data) => {
    const payload: EmployeeInput = {
      ...data,
      branchId: data.branchId || null,
      email: data.email || null,
    };
    if (editing) {
      const { code: _, ...rest } = payload;
      await updateMut.mutateAsync({ id: editing.id, data: rest });
    } else {
      await createMut.mutateAsync(payload);
    }
    reset();
  });

  const columns: Column<Employee>[] = [
    { key: 'code', header: 'รหัส', width: '90px', render: (e) => <span className="font-mono text-xs">{e.code}</span> },
    {
      key: 'name', header: 'ชื่อ-นามสกุล', render: (e) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rust to-gold-dark text-white grid place-items-center font-display font-semibold text-sm flex-none">
            {e.name.charAt(0)}
          </div>
          <div className="font-medium text-[13px]">{e.name}</div>
        </div>
      ),
    },
    { key: 'position', header: 'ตำแหน่ง', render: (e) => <Pill variant="muted">{e.position || '—'}</Pill> },
    { key: 'branch', header: 'สาขา', render: (e) => <span className="text-mute text-xs">{e.branchName || '—'}</span> },
    { key: 'phone', header: 'เบอร์', render: (e) => <span className="font-mono text-xs">{e.phone || '—'}</span> },
    { key: 'status', header: 'สถานะ', render: (e) => <Pill variant={e.isActive ? 'success' : 'muted'}>{e.isActive ? 'ใช้งาน' : 'ระงับ'}</Pill> },
    {
      key: 'actions', header: '', align: 'right', width: '100px', render: (e) => (
        <div className="flex justify-end gap-1">
          <button onClick={() => setEditing(e)} className="w-8 h-8 rounded grid place-items-center text-mute hover:bg-paper-2 hover:text-ink">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setDeleteId(e.id)} className="w-8 h-8 rounded grid place-items-center text-mute hover:bg-burgundy-soft hover:text-burgundy">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="ผู้ดูแลระบบ · พนักงาน"
        title="ทะเบียน"
        em="พนักงาน"
        desc="ข้อมูลพนักงานทั้งหมด แยกตามสาขาและตำแหน่ง"
        actions={<Button variant="rust" onClick={() => { reset(); setOpenForm(true); }}><Plus className="w-3.5 h-3.5" /> เพิ่มพนักงาน</Button>}
      />

      <div className="bg-white border border-rule rounded-xl p-4 mb-5 flex gap-3 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-mute" />
          <Input placeholder="ค้นหาชื่อ, รหัส, ตำแหน่ง..." className="pl-10" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div className="text-xs font-mono text-mute tracking-wider">{data ? `${data.total} คน` : '—'}</div>
      </div>

      <DataTable columns={columns} rows={data?.items || []} loading={isLoading}
        pagination={{ page, pageSize: 20, total: data?.total || 0, onPageChange: setPage }} />

      <Modal
        open={openForm || !!editing}
        onClose={() => { setOpenForm(false); setEditing(null); reset(); }}
        title={editing ? 'แก้ไขพนักงาน' : 'เพิ่มพนักงานใหม่'}
        size="md"
        footer={<>
          <Button onClick={() => { setOpenForm(false); setEditing(null); reset(); }}>ยกเลิก</Button>
          <Button variant="primary" onClick={onSubmit} disabled={createMut.isPending || updateMut.isPending}>
            {createMut.isPending || updateMut.isPending ? 'กำลังบันทึก...' : 'บันทึก'}
          </Button>
        </>}
      >
        <form onSubmit={onSubmit} className="grid grid-cols-2 gap-5">
          <Field label="รหัสพนักงาน">
            <Input {...register('code')} disabled={!!editing} placeholder="E001" />
            {errors.code && <span className="text-xs text-rust mt-1">{errors.code.message}</span>}
          </Field>
          <Field label="ตำแหน่ง"><Input {...register('position')} placeholder="พนักงานขาย, บัญชี..." /></Field>
          <Field label="ชื่อ-นามสกุล" className="col-span-2">
            <Input {...register('name')} />
            {errors.name && <span className="text-xs text-rust mt-1">{errors.name.message}</span>}
          </Field>
          <Field label="สาขา">
            <select {...register('branchId')} className="w-full px-3 py-2.5 border border-rule-strong rounded-lg text-sm focus:outline-none focus:border-ink">
              <option value="">— ไม่ระบุ —</option>
              {branches?.map((b) => (
                <option key={b.id} value={b.id}>{b.code} · {b.name}</option>
              ))}
            </select>
          </Field>
          <Field label="เบอร์โทร"><Input {...register('phone')} /></Field>
          <Field label="อีเมล" className="col-span-2"><Input type="email" {...register('email')} /></Field>
          <label className="col-span-2 flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" {...register('isActive')} className="accent-rust" />
            เปิดใช้งาน
          </label>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        message="ต้องการลบพนักงานคนนี้ใช่หรือไม่?"
        danger confirmText="ลบพนักงาน"
        loading={deleteMut.isPending}
        onConfirm={() => deleteMut.mutate(deleteId!)}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}
