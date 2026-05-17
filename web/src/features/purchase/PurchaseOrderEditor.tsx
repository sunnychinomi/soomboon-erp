import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Plus, Trash2, Save, Ban } from 'lucide-react';
import { purchaseOrdersApi } from '@/api/purchase-orders.api';
import { vendorsApi } from '@/api/vendors.api';
import { branchesApi } from '@/api/branches.api';
import { productsApi } from '@/api/products.api';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input, Field } from '@/components/ui/Input';
import { Pill } from '@/components/ui/Pill';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toast } from '@/components/ui/Toast';
import { fmt, cn } from '@/lib/utils';
import type { CreatePoItem, PoStatus } from '@/api/types';

interface PurchaseOrderEditorProps {
  poId: string | 'new';
  onBack: () => void;
}

interface FormState {
  poDate: string;
  vendorId: string;
  branchId: string;
  shipTo: string;
  paymentTerms: string;
  vatRate: number;
  discount: number;
  note: string;
}

interface LineItem extends CreatePoItem {
  _key: string; // local key for React
  receivedQuantity?: number;
}

const STATUS_LABEL: Record<PoStatus, string> = {
  Pending: 'รอดำเนินการ',
  Partial: 'รับบางส่วน',
  Received: 'รับครบ',
  Cancelled: 'ยกเลิก',
};

const STATUS_VARIANT: Record<PoStatus, 'warn' | 'info' | 'success' | 'danger'> = {
  Pending: 'warn',
  Partial: 'info',
  Received: 'success',
  Cancelled: 'danger',
};

export default function PurchaseOrderEditor({ poId, onBack }: PurchaseOrderEditorProps) {
  const qc = useQueryClient();
  const isNew = poId === 'new';
  const [items, setItems] = useState<LineItem[]>([]);
  const [cancelOpen, setCancelOpen] = useState(false);

  const { data: po, isLoading: loadingPo } = useQuery({
    queryKey: ['purchase-order', poId],
    queryFn: () => purchaseOrdersApi.get(poId),
    enabled: !isNew,
  });

  const { data: vendors } = useQuery({
    queryKey: ['vendors-all'],
    queryFn: () => vendorsApi.list({ pageSize: 200 }),
  });

  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchesApi.list(),
  });

  const { data: products } = useQuery({
    queryKey: ['products-all'],
    queryFn: () => productsApi.list({ pageSize: 500 }),
  });

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormState>({
    defaultValues: {
      poDate: new Date().toISOString().split('T')[0],
      vendorId: '',
      branchId: '',
      shipTo: '',
      paymentTerms: '',
      vatRate: 7,
      discount: 0,
      note: '',
    },
  });

  // Load PO into form
  useEffect(() => {
    if (po) {
      reset({
        poDate: po.poDate.split('T')[0],
        vendorId: po.vendorId || '',
        branchId: po.branchId || '',
        shipTo: po.shipTo || '',
        paymentTerms: po.paymentTerms || '',
        // Compute VAT rate from amounts (back-calculate)
        vatRate: po.subtotal > po.discount && (po.subtotal - po.discount) > 0
          ? Math.round((po.vat / (po.subtotal - po.discount)) * 100)
          : 7,
        discount: po.discount,
        note: po.note || '',
      });
      setItems(po.items.map((i) => ({
        _key: i.id,
        productId: i.productId,
        productName: i.productName,
        productCode: i.productCode,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        receivedQuantity: i.receivedQuantity,
      })));
    }
  }, [po, reset]);

  // Auto-fill ship-to from selected branch
  const branchId = watch('branchId');
  useEffect(() => {
    if (branchId && !watch('shipTo')) {
      const b = branches?.find((x) => x.id === branchId);
      if (b) setValue('shipTo', b.name);
    }
  }, [branchId, branches, setValue, watch]);

  // Compute totals
  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const discount = watch('discount') || 0;
  const vatRate = watch('vatRate') || 0;
  const afterDiscount = Math.max(0, subtotal - discount);
  const vat = Math.round(afterDiscount * (vatRate / 100) * 100) / 100;
  const total = afterDiscount + vat;

  const addItem = () => {
    setItems([...items, {
      _key: `new-${Date.now()}-${Math.random()}`,
      productId: null,
      productName: '',
      productCode: null,
      quantity: 1,
      unitPrice: 0,
    }]);
  };

  const removeItem = (key: string) => {
    setItems(items.filter((i) => i._key !== key));
  };

  const updateItem = (key: string, patch: Partial<LineItem>) => {
    setItems(items.map((i) => i._key === key ? { ...i, ...patch } : i));
  };

  const handleProductSelect = (key: string, productId: string) => {
    const product = products?.items.find((p) => p.id === productId);
    if (product) {
      updateItem(key, {
        productId: product.id,
        productName: product.name,
        productCode: product.code,
        unitPrice: product.cost,
      });
    }
  };

  const createMut = useMutation({
    mutationFn: purchaseOrdersApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast.success('สร้าง PO เรียบร้อย');
      onBack();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'สร้างไม่สำเร็จ'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => purchaseOrdersApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase-orders'] });
      qc.invalidateQueries({ queryKey: ['purchase-order', poId] });
      toast.success('แก้ไข PO เรียบร้อย');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'แก้ไขไม่สำเร็จ'),
  });

  const cancelMut = useMutation({
    mutationFn: () => purchaseOrdersApi.cancel(poId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast.success('ยกเลิก PO เรียบร้อย');
      setCancelOpen(false);
      onBack();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'ยกเลิกไม่สำเร็จ'),
  });

  const onSubmit = handleSubmit((data) => {
    if (!data.vendorId) { toast.error('กรุณาเลือกผู้ขาย'); return; }
    if (items.length === 0) { toast.error('กรุณาเพิ่มรายการสินค้า'); return; }
    if (items.some((i) => !i.productName || i.quantity <= 0 || i.unitPrice < 0)) {
      toast.error('กรุณากรอกข้อมูลรายการสินค้าให้ครบ'); return;
    }

    const payload = {
      poDate: data.poDate,
      vendorId: data.vendorId,
      branchId: data.branchId || null,
      shipTo: data.shipTo || null,
      paymentTerms: data.paymentTerms || null,
      discount: Number(data.discount) || 0,
      vatRate: Number(data.vatRate) || 0,
      note: data.note || null,
      items: items.map((i) => ({
        productId: i.productId || null,
        productName: i.productName,
        productCode: i.productCode || null,
        quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice),
      })),
    };

    if (isNew) {
      createMut.mutate(payload);
    } else {
      updateMut.mutate({ id: poId, data: payload });
    }
  });

  const readonly = !isNew && po && po.status !== 'Pending';
  const saving = createMut.isPending || updateMut.isPending;

  if (!isNew && loadingPo) {
    return <div className="text-center py-16 text-mute">กำลังโหลด...</div>;
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow={isNew ? 'จัดซื้อ · ใบสั่งซื้อใหม่' : `จัดซื้อ · ${po?.poNo}`}
        title={isNew ? 'สร้าง' : 'ใบสั่งซื้อ'}
        em={isNew ? 'ใบสั่งซื้อ' : po?.poNo}
        desc={po?.status ? `สถานะ: ${STATUS_LABEL[po.status]}` : 'กรอกข้อมูลใบสั่งซื้อ พร้อมรายการสินค้า'}
        actions={
          <>
            <Button onClick={onBack}><ArrowLeft className="w-3.5 h-3.5" /> กลับ</Button>
            {!readonly && (
              <Button variant="rust" onClick={onSubmit} disabled={saving}>
                <Save className="w-3.5 h-3.5" /> {saving ? 'กำลังบันทึก...' : 'บันทึก PO'}
              </Button>
            )}
            {!isNew && po?.status === 'Pending' && (
              <Button onClick={() => setCancelOpen(true)} className="text-burgundy hover:bg-burgundy-soft border-burgundy/30">
                <Ban className="w-3.5 h-3.5" /> ยกเลิก PO
              </Button>
            )}
          </>
        }
      />

      {po?.status && (
        <div className="mb-5 flex items-center gap-3">
          <Pill variant={STATUS_VARIANT[po.status]}>{STATUS_LABEL[po.status]}</Pill>
          {readonly && (
            <span className="text-xs text-mute italic">* ไม่สามารถแก้ไขได้เนื่องจาก {STATUS_LABEL[po.status]}</span>
          )}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-5">
        {/* Header info */}
        <div className="bg-white border border-rule rounded-xl p-6">
          <h3 className="font-display font-semibold text-lg mb-4">ข้อมูลใบสั่งซื้อ</h3>
          <div className="grid grid-cols-3 gap-5">
            <Field label="วันที่"><Input type="date" {...register('poDate', { required: true })} disabled={!!readonly} /></Field>
            <Field label="ผู้ขาย">
              <select {...register('vendorId', { required: true })} disabled={!!readonly}
                className={cn(
                  'w-full px-3 py-2.5 border rounded-lg text-sm bg-white focus:outline-none focus:border-ink',
                  errors.vendorId ? 'border-rust' : 'border-rule-strong',
                )}>
                <option value="">— เลือกผู้ขาย —</option>
                {vendors?.items.map((v) => (
                  <option key={v.id} value={v.id}>{v.code} · {v.name}</option>
                ))}
              </select>
            </Field>
            <Field label="สาขาที่รับ">
              <select {...register('branchId')} disabled={!!readonly}
                className="w-full px-3 py-2.5 border border-rule-strong rounded-lg text-sm bg-white focus:outline-none focus:border-ink">
                <option value="">— เลือกสาขา —</option>
                {branches?.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </Field>
            <Field label="ที่ส่งสินค้า" className="col-span-2"><Input {...register('shipTo')} disabled={!!readonly} /></Field>
            <Field label="เงื่อนไขชำระ"><Input {...register('paymentTerms')} placeholder="30 วัน" disabled={!!readonly} /></Field>
            <Field label="หมายเหตุ" className="col-span-3"><Input {...register('note')} disabled={!!readonly} /></Field>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white border border-rule rounded-xl">
          <div className="flex items-center justify-between p-6 border-b border-rule">
            <h3 className="font-display font-semibold text-lg">รายการสินค้า ({items.length})</h3>
            {!readonly && (
              <Button variant="primary" size="sm" type="button" onClick={addItem}>
                <Plus className="w-3 h-3" /> เพิ่มรายการ
              </Button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="text-center py-16 text-mute">
              ยังไม่มีรายการสินค้า — คลิก "เพิ่มรายการ" เพื่อเริ่ม
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-paper">
                  <tr>
                    <th className="text-left font-mono text-[10px] tracking-[0.14em] uppercase text-mute px-4 py-3 w-12">#</th>
                    <th className="text-left font-mono text-[10px] tracking-[0.14em] uppercase text-mute px-4 py-3">สินค้า</th>
                    <th className="text-right font-mono text-[10px] tracking-[0.14em] uppercase text-mute px-4 py-3 w-24">จำนวน</th>
                    <th className="text-right font-mono text-[10px] tracking-[0.14em] uppercase text-mute px-4 py-3 w-32">ราคา/หน่วย</th>
                    <th className="text-right font-mono text-[10px] tracking-[0.14em] uppercase text-mute px-4 py-3 w-32">รวม</th>
                    {!readonly && <th className="w-12"></th>}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const lineTotal = item.quantity * item.unitPrice;
                    return (
                      <tr key={item._key} className="border-b border-rule last:border-0">
                        <td className="px-4 py-2 text-mute font-mono text-xs">{idx + 1}</td>
                        <td className="px-4 py-2">
                          <select
                            value={item.productId || ''}
                            onChange={(e) => handleProductSelect(item._key, e.target.value)}
                            disabled={!!readonly}
                            className="w-full px-2.5 py-1.5 border border-rule rounded text-sm focus:outline-none focus:border-ink"
                          >
                            <option value="">— เลือกสินค้า —</option>
                            {products?.items.map((p) => (
                              <option key={p.id} value={p.id}>{p.code} · {p.name}</option>
                            ))}
                          </select>
                          {item.productCode && (
                            <div className="text-[10px] font-mono text-mute mt-1">
                              {item.productCode}
                              {item.receivedQuantity !== undefined && item.receivedQuantity > 0 && (
                                <span className="ml-2 text-green-700">✓ รับแล้ว {item.receivedQuantity}/{item.quantity}</span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(item._key, { quantity: Math.max(0, parseInt(e.target.value || '0')) })}
                            disabled={!!readonly}
                            className="w-full px-2 py-1.5 border border-rule rounded text-sm text-right font-mono focus:outline-none focus:border-ink"
                            min="0"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            value={item.unitPrice}
                            step="0.01"
                            onChange={(e) => updateItem(item._key, { unitPrice: Math.max(0, parseFloat(e.target.value || '0')) })}
                            disabled={!!readonly}
                            className="w-full px-2 py-1.5 border border-rule rounded text-sm text-right font-mono focus:outline-none focus:border-ink"
                            min="0"
                          />
                        </td>
                        <td className="px-4 py-2 text-right font-mono text-sm font-bold">฿{fmt.money(lineTotal)}</td>
                        {!readonly && (
                          <td className="px-2 py-2">
                            <button
                              type="button"
                              onClick={() => removeItem(item._key)}
                              className="w-7 h-7 rounded grid place-items-center text-mute hover:bg-burgundy-soft hover:text-burgundy"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Totals */}
        <div className="bg-white border border-rule rounded-xl p-6">
          <div className="grid grid-cols-2 gap-12">
            <div className="space-y-3">
              <Field label="ส่วนลดรวม (฿)">
                <Input type="number" step="0.01" {...register('discount')} disabled={!!readonly} />
              </Field>
              <Field label="VAT (%)">
                <Input type="number" step="0.01" {...register('vatRate')} disabled={!!readonly} />
              </Field>
            </div>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-mute">มูลค่าก่อนส่วนลด</span>
                <span className="font-mono">฿{fmt.money(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-mute">ส่วนลด</span>
                <span className="font-mono text-rust">−฿{fmt.money(discount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-mute">VAT {vatRate}%</span>
                <span className="font-mono">฿{fmt.money(vat)}</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-rule">
                <span className="font-display font-semibold">รวมทั้งสิ้น</span>
                <span className="editorial-num text-2xl text-rust">฿{fmt.money(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </form>

      <ConfirmDialog
        open={cancelOpen}
        title="ยกเลิกใบสั่งซื้อ?"
        message={`ต้องการยกเลิก ${po?.poNo} ใช่หรือไม่? PO ที่ยกเลิกแล้วไม่สามารถใช้งานต่อได้`}
        danger
        confirmText="ยืนยันยกเลิก"
        loading={cancelMut.isPending}
        onConfirm={() => cancelMut.mutate()}
        onClose={() => setCancelOpen(false)}
      />
    </div>
  );
}
