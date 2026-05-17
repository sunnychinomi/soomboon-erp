import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, FileText } from 'lucide-react';
import { creditNotesApi } from '@/api/credit-notes.api';
import { customersApi } from '@/api/customers.api';
import { salesOrdersApi } from '@/api/sales-orders.api';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input, Field } from '@/components/ui/Input';
import { Pill } from '@/components/ui/Pill';
import { Modal } from '@/components/ui/Modal';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { toast } from '@/components/ui/Toast';
import { fmt } from '@/lib/utils';
import type { CreditNoteListItem, CreateCreditNoteInput } from '@/api/types';

const schema = z.object({
  cnDate: z.string().min(1),
  referenceInvoiceId: z.string().optional().nullable(),
  customerId: z.string().min(1, 'กรุณาเลือกลูกค้า'),
  reason: z.string().min(1, 'ระบุเหตุผล'),
  amount: z.coerce.number().min(0.01, 'ยอดต้องมากกว่า 0'),
  note: z.string().optional().nullable(),
});
type FormData = z.infer<typeof schema>;

export default function CreditNotesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [customerId, setCustomerId] = useState<string>('');
  const [openForm, setOpenForm] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['credit-notes', { page, search, customerId }],
    queryFn: () => creditNotesApi.list({
      page, pageSize: 20, search,
      customerId: customerId || undefined,
    }),
  });

  const { data: customers } = useQuery({
    queryKey: ['customers-all'],
    queryFn: () => customersApi.list({ pageSize: 500 }),
  });

  const { data: salesOrders } = useQuery({
    queryKey: ['sales-orders-all'],
    queryFn: () => salesOrdersApi.list({ pageSize: 500 }),
    enabled: openForm,
  });

  const createMut = useMutation({
    mutationFn: (d: CreateCreditNoteInput) => creditNotesApi.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['credit-notes'] });
      toast.success('ออกใบลดหนี้เรียบร้อย');
      setOpenForm(false);
      reset();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'ไม่สำเร็จ'),
  });

  const { register, handleSubmit, reset, formState: { errors }, watch, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      cnDate: new Date().toISOString().split('T')[0],
      referenceInvoiceId: '',
      customerId: '',
      reason: '',
      amount: 0,
      note: '',
    },
  });

  // Auto-fill customer when invoice selected
  const refInvoiceId = watch('referenceInvoiceId');
  const selectedInvoice = salesOrders?.items.find((s) => s.id === refInvoiceId);
  if (selectedInvoice && watch('customerId') !== selectedInvoice.customerId) {
    setValue('customerId', selectedInvoice.customerId || '');
  }

  const onSubmit = handleSubmit((data) => {
    createMut.mutate({
      cnDate: data.cnDate,
      referenceInvoiceId: data.referenceInvoiceId || null,
      customerId: data.customerId,
      reason: data.reason,
      amount: data.amount,
      note: data.note || null,
    });
  });

  const totalAmount = data?.items.reduce((sum, c) => sum + c.amount, 0) || 0;

  const columns: Column<CreditNoteListItem>[] = [
    {
      key: 'cnNo',
      header: 'เลขที่',
      width: '140px',
      render: (c) => <span className="font-mono text-sm font-semibold">{c.cnNo}</span>,
    },
    {
      key: 'date',
      header: 'วันที่',
      width: '110px',
      render: (c) => <span className="font-mono text-xs">{new Date(c.cnDate).toLocaleDateString('th-TH')}</span>,
    },
    {
      key: 'invoice',
      header: 'อ้างอิง INV',
      render: (c) => (
        <span className="font-mono text-xs">
          {c.referenceInvoiceNo ? (
            <span className="inline-flex items-center gap-1"><FileText className="w-3 h-3" /> {c.referenceInvoiceNo}</span>
          ) : '—'}
        </span>
      ),
    },
    {
      key: 'customer',
      header: 'ลูกค้า',
      render: (c) => <span className="text-[13px]">{c.customerName}</span>,
    },
    {
      key: 'reason',
      header: 'เหตุผล',
      render: (c) => <Pill variant="muted">{c.reason}</Pill>,
    },
    {
      key: 'amount',
      header: 'ยอดเงิน',
      align: 'right',
      render: (c) => <strong className="font-mono text-rust">−฿{fmt.money(c.amount)}</strong>,
    },
  ];

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="การขาย · Credit Notes"
        title="ใบ"
        em="ลดหนี้"
        desc="ใบลดหนี้สำหรับสินค้าคืน หรือปรับลดยอดลูกค้า"
        actions={
          <Button variant="rust" onClick={() => { reset(); setOpenForm(true); }}>
            <Plus className="w-3.5 h-3.5" /> ออกใบลดหนี้
          </Button>
        }
      />

      <div className="grid grid-cols-3 bg-white border border-rule rounded-xl overflow-hidden mb-5 shadow-sm">
        <div className="p-5 border-r border-rule">
          <div className="font-mono text-[10px] uppercase tracking-wider text-mute mb-2">จำนวนใบ</div>
          <div className="editorial-num text-3xl text-ink">{data?.total || 0}</div>
        </div>
        <div className="p-5 border-r border-rule">
          <div className="font-mono text-[10px] uppercase tracking-wider text-mute mb-2">ยอดรวม (ที่แสดง)</div>
          <div className="editorial-num text-3xl text-rust">−฿{fmt.money(totalAmount)}</div>
        </div>
        <div className="p-5">
          <div className="font-mono text-[10px] uppercase tracking-wider text-mute mb-2">เฉลี่ย/ใบ</div>
          <div className="editorial-num text-3xl text-ink">
            ฿{fmt.money(data?.items.length ? totalAmount / data.items.length : 0)}
          </div>
        </div>
      </div>

      <div className="bg-white border border-rule rounded-xl p-4 mb-5 flex gap-3 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-mute" />
          <Input placeholder="ค้นหาเลขที่, ลูกค้า, เหตุผล..." className="pl-10"
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select
          value={customerId}
          onChange={(e) => { setCustomerId(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-rule-strong rounded-lg text-sm bg-white min-w-[200px] focus:outline-none focus:border-ink"
        >
          <option value="">ลูกค้าทั้งหมด</option>
          {customers?.items.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        rows={data?.items || []}
        loading={isLoading}
        emptyMessage="ยังไม่มีใบลดหนี้"
        pagination={{
          page,
          pageSize: 20,
          total: data?.total || 0,
          onPageChange: setPage,
        }}
      />

      <Modal
        open={openForm}
        onClose={() => { setOpenForm(false); reset(); }}
        title="ออกใบลดหนี้"
        size="md"
        footer={<>
          <Button onClick={() => { setOpenForm(false); reset(); }}>ยกเลิก</Button>
          <Button variant="rust" onClick={onSubmit} disabled={createMut.isPending}>
            {createMut.isPending ? 'กำลังบันทึก...' : 'บันทึก'}
          </Button>
        </>}
      >
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <Field label="วันที่"><Input type="date" {...register('cnDate')} /></Field>
            <Field label="อ้างอิง INV (ถ้ามี)">
              <select
                {...register('referenceInvoiceId')}
                className="w-full px-3 py-2.5 border border-rule-strong rounded-lg text-sm bg-white focus:outline-none focus:border-ink"
              >
                <option value="">— ไม่ระบุ —</option>
                {salesOrders?.items.map((s) => (
                  <option key={s.id} value={s.id}>{s.invoiceNo} · {s.customerName}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="ลูกค้า">
            <select
              {...register('customerId')}
              className="w-full px-3 py-2.5 border border-rule-strong rounded-lg text-sm bg-white focus:outline-none focus:border-ink"
            >
              <option value="">— เลือกลูกค้า —</option>
              {customers?.items.map((c) => (
                <option key={c.id} value={c.id}>{c.code} · {c.name}</option>
              ))}
            </select>
            {errors.customerId && <span className="text-xs text-rust mt-1">{errors.customerId.message}</span>}
          </Field>

          <Field label="เหตุผล">
            <select
              {...register('reason')}
              className="w-full px-3 py-2.5 border border-rule-strong rounded-lg text-sm bg-white focus:outline-none focus:border-ink"
            >
              <option value="">— เลือกเหตุผล —</option>
              <option value="สินค้าชำรุด">สินค้าชำรุด</option>
              <option value="รุ่นไม่ตรง">รุ่นไม่ตรง</option>
              <option value="ปรับปรุงราคา">ปรับปรุงราคา</option>
              <option value="ส่วนลดพิเศษ">ส่วนลดพิเศษ</option>
              <option value="อื่นๆ">อื่นๆ</option>
            </select>
            {errors.reason && <span className="text-xs text-rust mt-1">{errors.reason.message}</span>}
          </Field>

          <Field label="ยอดเงิน (฿)">
            <Input type="number" step="0.01" {...register('amount')} placeholder="0.00" />
            {errors.amount && <span className="text-xs text-rust mt-1">{errors.amount.message}</span>}
          </Field>

          <Field label="หมายเหตุ">
            <textarea
              {...register('note')}
              rows={2}
              className="w-full px-3 py-2.5 border border-rule-strong rounded-lg bg-white text-sm focus:outline-none focus:border-ink"
            />
          </Field>
        </form>
      </Modal>
    </div>
  );
}
