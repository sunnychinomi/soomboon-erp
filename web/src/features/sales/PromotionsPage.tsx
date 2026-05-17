import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Star, Edit2, Trash2, Calendar } from 'lucide-react';
import { promotionsApi } from '@/api/promotions.api';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input, Field } from '@/components/ui/Input';
import { Pill } from '@/components/ui/Pill';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toast } from '@/components/ui/Toast';
import type { Promotion, PromotionInput } from '@/api/types';

const schema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  description: z.string().optional().nullable(),
  discountPct: z.coerce.number().min(0).max(100).nullable().optional(),
  discountAmount: z.coerce.number().min(0).nullable().optional(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  isActive: z.boolean().optional(),
});
type FormData = z.infer<typeof schema>;

export default function PromotionsPage() {
  const qc = useQueryClient();
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: promotions, isLoading } = useQuery({
    queryKey: ['promotions', { showActiveOnly }],
    queryFn: () => promotionsApi.list(showActiveOnly || undefined),
  });

  const createMut = useMutation({
    mutationFn: (d: PromotionInput) => promotionsApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['promotions'] }); toast.success('เพิ่มโปรโมชันเรียบร้อย'); setOpenForm(false); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'ไม่สำเร็จ'),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Omit<PromotionInput, 'code'> }) => promotionsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['promotions'] }); toast.success('แก้ไขเรียบร้อย'); setEditing(null); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'ไม่สำเร็จ'),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => promotionsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['promotions'] }); toast.success('ลบเรียบร้อย'); setDeleteId(null); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'ไม่สำเร็จ'),
  });

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: editing ? {
      code: editing.code, name: editing.name, description: editing.description,
      discountPct: editing.discountPct, discountAmount: editing.discountAmount,
      startDate: editing.startDate.split('T')[0],
      endDate: editing.endDate.split('T')[0],
      isActive: editing.isActive,
    } : {
      code: '', name: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      isActive: true,
    } as FormData,
  });

  const onSubmit = handleSubmit(async (data) => {
    const payload: PromotionInput = {
      ...data,
      discountPct: data.discountPct || null,
      discountAmount: data.discountAmount || null,
    };
    if (editing) {
      const { code: _, ...rest } = payload;
      await updateMut.mutateAsync({ id: editing.id, data: rest });
    } else {
      await createMut.mutateAsync(payload);
    }
    reset();
  });

  const activePromos = promotions?.filter((p) => p.isCurrentlyActive) || [];
  const upcomingPromos = promotions?.filter((p) => p.isActive && new Date(p.startDate) > new Date()) || [];
  const expiredPromos = promotions?.filter((p) => new Date(p.endDate) < new Date()) || [];

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="การขาย · Promotions"
        title="โปรโมชัน"
        em="ส่วนลด"
        desc="จัดการโปรโมชันที่ใช้สำหรับลดราคาในใบขาย"
        actions={
          <>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={showActiveOnly} onChange={(e) => setShowActiveOnly(e.target.checked)} className="accent-rust" />
              เฉพาะที่ใช้งานได้
            </label>
            <Button variant="rust" onClick={() => { reset(); setOpenForm(true); }}>
              <Plus className="w-3.5 h-3.5" /> เพิ่มโปรโมชัน
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-3 bg-white border border-rule rounded-xl overflow-hidden mb-5 shadow-sm">
        <div className="p-5 border-r border-rule">
          <div className="font-mono text-[10px] uppercase tracking-wider text-mute mb-2 flex items-center gap-1.5">
            <Star className="w-3 h-3 text-gold-dark" /> ใช้งานอยู่
          </div>
          <div className="editorial-num text-3xl text-gold-dark">{activePromos.length}</div>
        </div>
        <div className="p-5 border-r border-rule">
          <div className="font-mono text-[10px] uppercase tracking-wider text-mute mb-2">กำลังมา</div>
          <div className="editorial-num text-3xl text-indigo">{upcomingPromos.length}</div>
        </div>
        <div className="p-5">
          <div className="font-mono text-[10px] uppercase tracking-wider text-mute mb-2">หมดอายุแล้ว</div>
          <div className="editorial-num text-3xl text-mute">{expiredPromos.length}</div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-mute">กำลังโหลด...</div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {promotions?.map((p) => (
            <div key={p.id} className={`bg-white border-2 rounded-xl p-5 relative ${p.isCurrentlyActive ? 'border-gold' : 'border-rule'}`}>
              {p.isCurrentlyActive && (
                <Pill variant="gold" className="absolute top-3 right-3">
                  <Star className="w-3 h-3" /> ใช้งานอยู่
                </Pill>
              )}
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-soft to-gold-glow border border-gold/30 grid place-items-center text-gold-dark flex-none">
                  <Star className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-display font-semibold text-base">{p.name}</div>
                  <div className="font-mono text-[10px] text-mute tracking-wider mt-0.5">{p.code}</div>
                </div>
              </div>

              {p.description && (
                <div className="text-xs text-mute mb-3 line-clamp-2">{p.description}</div>
              )}

              <div className="flex items-baseline gap-2 mb-3">
                {p.discountPct ? (
                  <>
                    <span className="editorial-num text-3xl text-rust">{p.discountPct}%</span>
                    <span className="text-xs text-mute">ส่วนลด</span>
                  </>
                ) : p.discountAmount ? (
                  <>
                    <span className="editorial-num text-3xl text-rust">฿{p.discountAmount}</span>
                    <span className="text-xs text-mute">ลด</span>
                  </>
                ) : (
                  <span className="text-xs text-mute italic">ไม่ได้กำหนดส่วนลด</span>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-xs text-mute font-mono mb-4">
                <Calendar className="w-3 h-3" />
                {new Date(p.startDate).toLocaleDateString('th-TH')} → {new Date(p.endDate).toLocaleDateString('th-TH')}
              </div>

              <div className="flex gap-2">
                <Button size="sm" className="flex-1" onClick={() => setEditing(p)}>
                  <Edit2 className="w-3 h-3" /> แก้ไข
                </Button>
                <button
                  onClick={() => setDeleteId(p.id)}
                  className="w-9 h-9 rounded-lg border border-rule text-mute hover:bg-burgundy-soft hover:text-burgundy hover:border-burgundy/30 grid place-items-center"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={() => { reset(); setOpenForm(true); }}
            className="border-2 border-dashed border-rule rounded-xl p-6 flex flex-col items-center justify-center text-mute hover:border-rust hover:text-rust hover:bg-paper transition-colors min-h-[280px]"
          >
            <Plus className="w-10 h-10 mb-3 opacity-50" />
            <span className="font-medium">เพิ่มโปรโมชันใหม่</span>
          </button>
        </div>
      )}

      <Modal
        open={openForm || !!editing}
        onClose={() => { setOpenForm(false); setEditing(null); reset(); }}
        title={editing ? 'แก้ไขโปรโมชัน' : 'เพิ่มโปรโมชันใหม่'}
        size="md"
        footer={<>
          <Button onClick={() => { setOpenForm(false); setEditing(null); reset(); }}>ยกเลิก</Button>
          <Button variant="primary" onClick={onSubmit} disabled={createMut.isPending || updateMut.isPending}>
            {createMut.isPending || updateMut.isPending ? 'กำลังบันทึก...' : 'บันทึก'}
          </Button>
        </>}
      >
        <form onSubmit={onSubmit} className="grid grid-cols-2 gap-5">
          <Field label="รหัส">
            <Input {...register('code')} disabled={!!editing} placeholder="PRM-001" />
            {errors.code && <span className="text-xs text-rust">{errors.code.message}</span>}
          </Field>
          <Field label="ชื่อโปรโมชัน">
            <Input {...register('name')} placeholder="ลดน้ำมันเครื่อง 15%" />
            {errors.name && <span className="text-xs text-rust">{errors.name.message}</span>}
          </Field>
          <Field label="คำอธิบาย" className="col-span-2">
            <Input {...register('description')} />
          </Field>
          <Field label="ส่วนลด %">
            <Input type="number" step="0.01" {...register('discountPct')} placeholder="15" />
          </Field>
          <Field label="หรือลดเป็นบาท">
            <Input type="number" step="0.01" {...register('discountAmount')} placeholder="200" />
          </Field>
          <Field label="วันเริ่ม"><Input type="date" {...register('startDate')} /></Field>
          <Field label="วันสิ้นสุด"><Input type="date" {...register('endDate')} /></Field>
          <label className="col-span-2 flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" {...register('isActive')} className="accent-rust" />
            เปิดใช้งาน
          </label>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        message="ต้องการลบโปรโมชันนี้ใช่หรือไม่?"
        danger confirmText="ลบโปรโมชัน"
        loading={deleteMut.isPending}
        onConfirm={() => deleteMut.mutate(deleteId!)}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}
