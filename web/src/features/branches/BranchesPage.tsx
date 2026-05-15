import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Building2, Edit2, Trash2, Users } from 'lucide-react';
import { branchesApi } from '@/api/branches.api';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input, Field } from '@/components/ui/Input';
import { Pill } from '@/components/ui/Pill';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toast } from '@/components/ui/Toast';
import type { Branch, BranchInput } from '@/api/types';

const schema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(200),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  isHeadquarters: z.boolean(),
  isActive: z.boolean().optional(),
});
type FormData = z.infer<typeof schema>;

export default function BranchesPage() {
  const qc = useQueryClient();
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: branches, isLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchesApi.list(),
  });

  const createMut = useMutation({
    mutationFn: (d: BranchInput) => branchesApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['branches'] }); toast.success('เพิ่มสาขาเรียบร้อย'); setOpenForm(false); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'ไม่สำเร็จ'),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Omit<BranchInput, 'code'> }) => branchesApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['branches'] }); toast.success('แก้ไขเรียบร้อย'); setEditing(null); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'ไม่สำเร็จ'),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => branchesApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['branches'] }); toast.success('ลบเรียบร้อย'); setDeleteId(null); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'ไม่สำเร็จ'),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: editing ? {
      code: editing.code, name: editing.name, address: editing.address,
      phone: editing.phone, isHeadquarters: editing.isHeadquarters, isActive: editing.isActive,
    } : { code: '', name: '', isHeadquarters: false, isActive: true } as FormData,
  });

  const onSubmit = handleSubmit(async (data) => {
    if (editing) {
      const { code: _, ...rest } = data;
      await updateMut.mutateAsync({ id: editing.id, data: rest });
    } else {
      await createMut.mutateAsync(data);
    }
    reset();
  });

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="ผู้ดูแลระบบ · สาขา"
        title="จัดการ"
        em="สาขา"
        desc="ข้อมูลสาขาและที่ตั้งของกิจการ"
        actions={<Button variant="rust" onClick={() => { reset(); setOpenForm(true); }}><Plus className="w-3.5 h-3.5" /> เพิ่มสาขา</Button>}
      />

      {isLoading ? (
        <div className="text-center py-16 text-mute">กำลังโหลด...</div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {branches?.map((b) => (
            <div key={b.id} className="bg-white border border-rule rounded-xl p-6 relative hover:border-rust transition-colors group">
              {b.isHeadquarters && (
                <Pill variant="gold" className="absolute top-4 right-4">สำนักงานใหญ่</Pill>
              )}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-indigo text-white grid place-items-center flex-none">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-display font-semibold text-lg">{b.name}</div>
                  <div className="font-mono text-[10px] text-mute tracking-wider mt-0.5">{b.code}</div>
                </div>
              </div>

              <div className="text-[12.5px] leading-relaxed text-ink-2 pb-4 border-b border-dashed border-rule mb-4 min-h-[50px]">
                {b.address || <span className="text-mute italic">ไม่ระบุที่อยู่</span>}
              </div>

              <div className="flex justify-between items-center text-xs text-mute font-mono mb-4">
                <span>📞 {b.phone || '—'}</span>
                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {b.employeeCount} คน</span>
              </div>

              <div className="flex gap-2">
                <Button size="sm" className="flex-1" onClick={() => setEditing(b)}>
                  <Edit2 className="w-3 h-3" /> แก้ไข
                </Button>
                <button
                  onClick={() => setDeleteId(b.id)}
                  disabled={b.isHeadquarters}
                  className="w-9 h-9 rounded-lg border border-rule text-mute hover:bg-burgundy-soft hover:text-burgundy hover:border-burgundy/30 disabled:opacity-40 disabled:cursor-not-allowed grid place-items-center transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {/* Add new card */}
          <button
            onClick={() => { reset(); setOpenForm(true); }}
            className="border-2 border-dashed border-rule rounded-xl p-6 flex flex-col items-center justify-center text-mute hover:border-rust hover:text-rust hover:bg-paper transition-colors min-h-[240px]"
          >
            <Plus className="w-10 h-10 mb-3 opacity-50" />
            <span className="font-medium">เพิ่มสาขาใหม่</span>
            <span className="text-xs mt-1">กำหนดที่ตั้งและข้อมูลติดต่อ</span>
          </button>
        </div>
      )}

      <Modal
        open={openForm || !!editing}
        onClose={() => { setOpenForm(false); setEditing(null); reset(); }}
        title={editing ? 'แก้ไขสาขา' : 'เพิ่มสาขาใหม่'}
        size="md"
        footer={<>
          <Button onClick={() => { setOpenForm(false); setEditing(null); reset(); }}>ยกเลิก</Button>
          <Button variant="primary" onClick={onSubmit} disabled={createMut.isPending || updateMut.isPending}>
            {createMut.isPending || updateMut.isPending ? 'กำลังบันทึก...' : 'บันทึก'}
          </Button>
        </>}
      >
        <form onSubmit={onSubmit} className="grid grid-cols-2 gap-5">
          <Field label="รหัสสาขา">
            <Input {...register('code')} disabled={!!editing} placeholder="BR01" />
            {errors.code && <span className="text-xs text-rust mt-1">{errors.code.message}</span>}
          </Field>
          <Field label="เบอร์โทร"><Input {...register('phone')} placeholder="037-XXX-XXX" /></Field>
          <Field label="ชื่อสาขา" className="col-span-2">
            <Input {...register('name')} />
            {errors.name && <span className="text-xs text-rust mt-1">{errors.name.message}</span>}
          </Field>
          <Field label="ที่อยู่" className="col-span-2">
            <Input {...register('address')} placeholder="29,31 ถ. ... ต. ... จ. ..." />
          </Field>
          <label className="col-span-2 flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" {...register('isHeadquarters')} className="accent-rust" />
            สำนักงานใหญ่ (HQ — มีได้สาขาเดียว)
          </label>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        message="ต้องการลบสาขานี้ใช่หรือไม่? (ไม่สามารถลบสำนักงานใหญ่หรือสาขาที่มีพนักงานอยู่)"
        danger confirmText="ลบสาขา"
        loading={deleteMut.isPending}
        onConfirm={() => deleteMut.mutate(deleteId!)}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}
