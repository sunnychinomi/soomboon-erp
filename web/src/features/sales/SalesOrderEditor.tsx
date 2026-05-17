import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Plus, Trash2, Save, Ban, Star, Receipt as ReceiptIcon } from 'lucide-react';
import { salesOrdersApi } from '@/api/sales-orders.api';
import { customersApi } from '@/api/customers.api';
import { branchesApi } from '@/api/branches.api';
import { employeesApi } from '@/api/employees.api';
import { productsApi } from '@/api/products.api';
import { promotionsApi } from '@/api/promotions.api';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input, Field } from '@/components/ui/Input';
import { Pill } from '@/components/ui/Pill';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toast } from '@/components/ui/Toast';
import { fmt, cn } from '@/lib/utils';
import type { CreateSoItem, SalesOrderStatus } from '@/api/types';
import { ReceiveSalesPaymentModal } from './ReceiveSalesPaymentModal';

interface SalesOrderEditorProps {
  soId: string | 'new';
  onBack: () => void;
}

interface FormState {
  orderDate: string;
  customerId: string;
  branchId: string;
  salespersonId: string;
  paymentTerms: string;
  dueDate: string;
  vatRate: number;
  discount: number;
  note: string;
}

interface LineItem extends CreateSoItem {
  _key: string;
}

const STATUS_LABEL: Record<SalesOrderStatus, string> = {
  Unpaid: 'ค้างชำระ',
  Partial: 'ชำระบางส่วน',
  Paid: 'ชำระแล้ว',
  Cancelled: 'ยกเลิก',
};
const STATUS_VARIANT: Record<SalesOrderStatus, 'warn' | 'info' | 'success' | 'danger'> = {
  Unpaid: 'warn',
  Partial: 'info',
  Paid: 'success',
  Cancelled: 'danger',
};

export default function SalesOrderEditor({ soId, onBack }: SalesOrderEditorProps) {
  const qc = useQueryClient();
  const isNew = soId === 'new';
  const [items, setItems] = useState<LineItem[]>([]);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);

  const { data: so, isLoading } = useQuery({
    queryKey: ['sales-order', soId],
    queryFn: () => salesOrdersApi.get(soId),
    enabled: !isNew,
  });

  const { data: customers } = useQuery({
    queryKey: ['customers-all'],
    queryFn: () => customersApi.list({ pageSize: 500 }),
  });
  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchesApi.list(),
  });
  const { data: employees } = useQuery({
    queryKey: ['employees-all'],
    queryFn: () => employeesApi.list({ pageSize: 200 }),
  });
  const { data: products } = useQuery({
    queryKey: ['products-all'],
    queryFn: () => productsApi.list({ pageSize: 500 }),
  });
  const { data: promotions } = useQuery({
    queryKey: ['promotions-active'],
    queryFn: () => promotionsApi.list(true),
  });

  const { register, handleSubmit, reset, watch, setValue } = useForm<FormState>({
    defaultValues: {
      orderDate: new Date().toISOString().split('T')[0],
      customerId: '',
      branchId: '',
      salespersonId: '',
      paymentTerms: '',
      dueDate: '',
      vatRate: 7,
      discount: 0,
      note: '',
    },
  });

  useEffect(() => {
    if (so) {
      reset({
        orderDate: so.orderDate.split('T')[0],
        customerId: so.customerId || '',
        branchId: so.branchId || '',
        salespersonId: so.salespersonId || '',
        paymentTerms: so.paymentTerms || '',
        dueDate: so.dueDate?.split('T')[0] || '',
        vatRate: so.subtotal > so.discount && (so.subtotal - so.discount) > 0
          ? Math.round((so.vat / (so.subtotal - so.discount)) * 100) : 7,
        discount: 0, // additional discount (header-level only); item-level included
        note: so.note || '',
      });
      setItems(so.items.map((i) => ({
        _key: i.id,
        productId: i.productId,
        productName: i.productName,
        productCode: i.productCode,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        discountPct: i.discountPct,
        discountAmount: i.discountAmount,
        promotionId: i.promotionId,
      })));
    }
  }, [so, reset]);

  // Auto-fill customer payment terms
  const customerId = watch('customerId');
  useEffect(() => {
    if (customerId && isNew) {
      const c = customers?.items.find((x) => x.id === customerId);
      if (c && !watch('paymentTerms')) setValue('paymentTerms', c.creditTerms || '');
    }
  }, [customerId, customers, isNew, setValue, watch]);

  // Calculate totals
  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const itemsDiscount = items.reduce((sum, i) => {
    const gross = i.quantity * i.unitPrice;
    return sum + i.discountAmount + (gross * i.discountPct / 100);
  }, 0);
  const headerDiscount = Number(watch('discount')) || 0;
  const totalDiscount = itemsDiscount + headerDiscount;
  const vatRate = Number(watch('vatRate')) || 0;
  const afterDiscount = Math.max(0, subtotal - totalDiscount);
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
      discountPct: 0,
      discountAmount: 0,
      promotionId: null,
    }]);
  };
  const removeItem = (key: string) => setItems(items.filter((i) => i._key !== key));
  const updateItem = (key: string, patch: Partial<LineItem>) =>
    setItems(items.map((i) => i._key === key ? { ...i, ...patch } : i));

  const handleProductSelect = (key: string, productId: string) => {
    const p = products?.items.find((x) => x.id === productId);
    if (p) {
      updateItem(key, {
        productId: p.id,
        productName: p.name,
        productCode: p.code,
        unitPrice: p.price,
      });
    }
  };

  const handlePromotionSelect = (key: string, promotionId: string) => {
    const item = items.find((i) => i._key === key);
    if (!item) return;
    const promo = promotions?.find((p) => p.id === promotionId);
    if (!promo) {
      updateItem(key, { promotionId: null, discountPct: 0, discountAmount: 0 });
      return;
    }
    updateItem(key, {
      promotionId: promo.id,
      discountPct: promo.discountPct || 0,
      discountAmount: promo.discountAmount || 0,
    });
  };

  const createMut = useMutation({
    mutationFn: salesOrdersApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales-orders'] });
      qc.invalidateQueries({ queryKey: ['stocks'] });
      qc.invalidateQueries({ queryKey: ['stock-movements'] });
      toast.success('สร้างใบขายเรียบร้อย');
      onBack();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'สร้างไม่สำเร็จ'),
  });

  const cancelMut = useMutation({
    mutationFn: () => salesOrdersApi.cancel(soId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales-orders'] });
      qc.invalidateQueries({ queryKey: ['stocks'] });
      toast.success('ยกเลิกใบขายเรียบร้อย');
      setCancelOpen(false);
      onBack();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'ยกเลิกไม่สำเร็จ'),
  });

  const onSubmit = handleSubmit((data) => {
    if (!data.customerId) { toast.error('กรุณาเลือกลูกค้า'); return; }
    if (items.length === 0) { toast.error('กรุณาเพิ่มรายการสินค้า'); return; }
    if (items.some((i) => !i.productName || i.quantity <= 0)) {
      toast.error('กรุณากรอกข้อมูลรายการให้ครบ'); return;
    }

    createMut.mutate({
      orderDate: data.orderDate,
      customerId: data.customerId,
      branchId: data.branchId || null,
      salespersonId: data.salespersonId || null,
      paymentTerms: data.paymentTerms || null,
      dueDate: data.dueDate || null,
      discount: Number(data.discount) || 0,
      vatRate: Number(data.vatRate) || 0,
      note: data.note || null,
      items: items.map((i) => ({
        productId: i.productId || null,
        productName: i.productName,
        productCode: i.productCode || null,
        quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice),
        discountPct: Number(i.discountPct) || 0,
        discountAmount: Number(i.discountAmount) || 0,
        promotionId: i.promotionId || null,
      })),
    });
  });

  const readonly = !isNew && so && so.status !== 'Unpaid'; // can't edit after partial paid
  const canCancel = !isNew && so && so.status === 'Unpaid' && so.receipts.length === 0;
  const canReceivePayment = !isNew && so && (so.status === 'Unpaid' || so.status === 'Partial');

  if (!isNew && isLoading) {
    return <div className="text-center py-16 text-mute">กำลังโหลด...</div>;
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow={isNew ? 'การขาย · ใบขายใหม่' : `การขาย · ${so?.invoiceNo}`}
        title={isNew ? 'สร้าง' : 'ใบขาย'}
        em={isNew ? 'ใบขายสินค้า' : so?.invoiceNo}
        desc={so?.status ? `สถานะ: ${STATUS_LABEL[so.status]}` : 'กรอกข้อมูลใบขาย พร้อมรายการสินค้า'}
        actions={
          <>
            <Button onClick={onBack}><ArrowLeft className="w-3.5 h-3.5" /> กลับ</Button>
            {isNew && (
              <Button variant="rust" onClick={onSubmit} disabled={createMut.isPending}>
                <Save className="w-3.5 h-3.5" /> {createMut.isPending ? 'กำลังบันทึก...' : 'บันทึกใบขาย'}
              </Button>
            )}
            {canReceivePayment && (
              <Button variant="primary" onClick={() => setPaymentOpen(true)}>
                <ReceiptIcon className="w-3.5 h-3.5" /> รับชำระเงิน
              </Button>
            )}
            {canCancel && (
              <Button onClick={() => setCancelOpen(true)} className="text-burgundy hover:bg-burgundy-soft border-burgundy/30">
                <Ban className="w-3.5 h-3.5" /> ยกเลิก
              </Button>
            )}
          </>
        }
      />

      {so?.status && (
        <div className="mb-5 flex items-center gap-3">
          <Pill variant={STATUS_VARIANT[so.status]}>{STATUS_LABEL[so.status]}</Pill>
          {so.balance > 0 && so.status !== 'Cancelled' && (
            <span className="font-mono text-xs text-rust">ค้างชำระ ฿{fmt.money(so.balance)}</span>
          )}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="bg-white border border-rule rounded-xl p-6">
          <h3 className="font-display font-semibold text-lg mb-4">ข้อมูลใบขาย</h3>
          <div className="grid grid-cols-3 gap-5">
            <Field label="วันที่"><Input type="date" {...register('orderDate', { required: true })} disabled={!!readonly} /></Field>
            <Field label="ลูกค้า">
              <select {...register('customerId', { required: true })} disabled={!!readonly}
                className="w-full px-3 py-2.5 border border-rule-strong rounded-lg text-sm bg-white focus:outline-none focus:border-ink">
                <option value="">— เลือกลูกค้า —</option>
                {customers?.items.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} · {c.name} {c.grade && `[${c.grade}]`}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="สาขาที่ขาย">
              <select {...register('branchId')} disabled={!!readonly}
                className="w-full px-3 py-2.5 border border-rule-strong rounded-lg text-sm bg-white focus:outline-none focus:border-ink">
                <option value="">— เลือกสาขา —</option>
                {branches?.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </Field>
            <Field label="พนักงานขาย">
              <select {...register('salespersonId')} disabled={!!readonly}
                className="w-full px-3 py-2.5 border border-rule-strong rounded-lg text-sm bg-white focus:outline-none focus:border-ink">
                <option value="">— ไม่ระบุ —</option>
                {employees?.items.map((e) => (
                  <option key={e.id} value={e.id}>{e.code} · {e.name}</option>
                ))}
              </select>
            </Field>
            <Field label="เงื่อนไขชำระ"><Input {...register('paymentTerms')} placeholder="30 วัน, เงินสด" disabled={!!readonly} /></Field>
            <Field label="ครบกำหนดชำระ"><Input type="date" {...register('dueDate')} disabled={!!readonly} /></Field>
            <Field label="หมายเหตุ" className="col-span-3"><Input {...register('note')} disabled={!!readonly} /></Field>
          </div>
        </div>

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
                    <th className="text-left font-mono text-[10px] tracking-[0.14em] uppercase text-mute px-3 py-3 w-10">#</th>
                    <th className="text-left font-mono text-[10px] tracking-[0.14em] uppercase text-mute px-3 py-3">สินค้า</th>
                    <th className="text-right font-mono text-[10px] tracking-[0.14em] uppercase text-mute px-3 py-3 w-20">จำนวน</th>
                    <th className="text-right font-mono text-[10px] tracking-[0.14em] uppercase text-mute px-3 py-3 w-28">ราคา</th>
                    <th className="text-left font-mono text-[10px] tracking-[0.14em] uppercase text-mute px-3 py-3 w-48">โปรโมชัน</th>
                    <th className="text-right font-mono text-[10px] tracking-[0.14em] uppercase text-mute px-3 py-3 w-20">ลด%</th>
                    <th className="text-right font-mono text-[10px] tracking-[0.14em] uppercase text-mute px-3 py-3 w-28">ลด ฿</th>
                    <th className="text-right font-mono text-[10px] tracking-[0.14em] uppercase text-mute px-3 py-3 w-28">รวม</th>
                    {!readonly && <th className="w-10"></th>}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const gross = item.quantity * item.unitPrice;
                    const discount = item.discountAmount + (gross * item.discountPct / 100);
                    const lineTotal = Math.max(0, gross - discount);
                    return (
                      <tr key={item._key} className="border-b border-rule last:border-0">
                        <td className="px-3 py-2 text-mute font-mono text-xs">{idx + 1}</td>
                        <td className="px-3 py-2">
                          <select
                            value={item.productId || ''}
                            onChange={(e) => handleProductSelect(item._key, e.target.value)}
                            disabled={!!readonly}
                            className="w-full px-2 py-1.5 border border-rule rounded text-xs focus:outline-none focus:border-ink"
                          >
                            <option value="">— เลือกสินค้า —</option>
                            {products?.items.map((p) => (
                              <option key={p.id} value={p.id}>{p.code} · {p.name}</option>
                            ))}
                          </select>
                          {item.productCode && (
                            <div className="text-[10px] font-mono text-mute mt-1">{item.productCode}</div>
                          )}
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(item._key, { quantity: Math.max(0, parseInt(e.target.value || '0')) })}
                            disabled={!!readonly}
                            className="w-full px-2 py-1.5 border border-rule rounded text-sm text-right font-mono focus:outline-none focus:border-ink"
                            min="0"
                          />
                        </td>
                        <td className="px-2 py-2">
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
                        <td className="px-2 py-2">
                          <select
                            value={item.promotionId || ''}
                            onChange={(e) => handlePromotionSelect(item._key, e.target.value)}
                            disabled={!!readonly}
                            className="w-full px-2 py-1.5 border border-rule rounded text-xs focus:outline-none focus:border-ink"
                          >
                            <option value="">— ไม่มี —</option>
                            {promotions?.map((p) => (
                              <option key={p.id} value={p.id}>
                                ★ {p.code} · {p.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            value={item.discountPct}
                            step="0.01"
                            onChange={(e) => updateItem(item._key, { discountPct: parseFloat(e.target.value || '0') })}
                            disabled={!!readonly}
                            className="w-full px-2 py-1.5 border border-rule rounded text-sm text-right font-mono focus:outline-none focus:border-ink"
                            min="0" max="100"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            value={item.discountAmount}
                            step="0.01"
                            onChange={(e) => updateItem(item._key, { discountAmount: parseFloat(e.target.value || '0') })}
                            disabled={!!readonly}
                            className="w-full px-2 py-1.5 border border-rule rounded text-sm text-right font-mono focus:outline-none focus:border-ink"
                            min="0"
                          />
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-sm font-bold">฿{fmt.money(lineTotal)}</td>
                        {!readonly && (
                          <td className="px-2 py-2">
                            <button type="button" onClick={() => removeItem(item._key)}
                              className="w-7 h-7 rounded grid place-items-center text-mute hover:bg-burgundy-soft hover:text-burgundy">
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

        <div className="bg-white border border-rule rounded-xl p-6">
          <div className="grid grid-cols-2 gap-12">
            <div className="space-y-3">
              <Field label="ส่วนลดเพิ่ม (฿)">
                <Input type="number" step="0.01" {...register('discount')} disabled={!!readonly} />
              </Field>
              <Field label="VAT (%)">
                <Input type="number" step="0.01" {...register('vatRate')} disabled={!!readonly} />
              </Field>
            </div>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between"><span className="text-mute">มูลค่าก่อนลด</span><span className="font-mono">฿{fmt.money(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-mute">ส่วนลดรวม</span><span className="font-mono text-rust">−฿{fmt.money(totalDiscount)}</span></div>
              <div className="flex justify-between"><span className="text-mute">VAT {vatRate}%</span><span className="font-mono">฿{fmt.money(vat)}</span></div>
              <div className="flex justify-between pt-3 border-t border-rule">
                <span className="font-display font-semibold">รวมทั้งสิ้น</span>
                <span className="editorial-num text-2xl text-rust">฿{fmt.money(total)}</span>
              </div>
              {so && so.paidAmount > 0 && (
                <>
                  <div className="flex justify-between text-green-700"><span>รับชำระแล้ว</span><span className="font-mono">฿{fmt.money(so.paidAmount)}</span></div>
                  <div className="flex justify-between font-bold"><span>คงเหลือ</span><span className="font-mono text-rust">฿{fmt.money(so.balance)}</span></div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Receipts list (if existing SO) */}
        {so && so.receipts.length > 0 && (
          <div className="bg-white border border-rule rounded-xl p-6">
            <h3 className="font-display font-semibold text-lg mb-4">ประวัติการรับชำระ ({so.receipts.length})</h3>
            <table className="w-full">
              <thead className="bg-paper">
                <tr className="text-left font-mono text-[10px] tracking-wider uppercase text-mute">
                  <th className="px-3 py-2">วันที่</th>
                  <th className="px-3 py-2">เลขที่ใบเสร็จ</th>
                  <th className="px-3 py-2">วิธี</th>
                  <th className="px-3 py-2 text-right">ยอด</th>
                </tr>
              </thead>
              <tbody>
                {so.receipts.map((r) => (
                  <tr key={r.id} className="border-t border-rule">
                    <td className="px-3 py-2 font-mono text-xs">{new Date(r.receiptDate).toLocaleDateString('th-TH')}</td>
                    <td className="px-3 py-2 font-mono text-xs">{r.receiptNo}</td>
                    <td className="px-3 py-2 text-xs">{r.paymentMethod === 'Cash' ? 'เงินสด' : r.paymentMethod === 'Transfer' ? 'โอน' : r.paymentMethod === 'Cheque' ? 'เช็ค' : r.paymentMethod}</td>
                    <td className="px-3 py-2 text-right font-mono font-bold text-green-700">+฿{fmt.money(r.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </form>

      <ConfirmDialog
        open={cancelOpen}
        title="ยกเลิกใบขาย?"
        message={`ต้องการยกเลิก ${so?.invoiceNo} ใช่หรือไม่? ระบบจะคืนสต็อกอัตโนมัติ`}
        danger
        confirmText="ยืนยันยกเลิก"
        loading={cancelMut.isPending}
        onConfirm={() => cancelMut.mutate()}
        onClose={() => setCancelOpen(false)}
      />

      {so && (
        <ReceiveSalesPaymentModal
          open={paymentOpen}
          salesOrder={so}
          onClose={() => setPaymentOpen(false)}
        />
      )}
    </div>
  );
}
