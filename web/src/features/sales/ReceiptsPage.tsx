import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Receipt as ReceiptIcon, Banknote, Wallet, FileCheck, CreditCard } from 'lucide-react';
import { receiptsApi } from '@/api/receipts.api';
import { customersApi } from '@/api/customers.api';
import { PageHeader } from '@/components/ui/PageHeader';
import { Input } from '@/components/ui/Input';
import { Pill } from '@/components/ui/Pill';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { fmt } from '@/lib/utils';
import type { ReceiptListItem, PaymentMethod } from '@/api/types';

const METHOD_ICONS: Record<PaymentMethod, any> = {
  Cash: Banknote,
  Transfer: Wallet,
  Cheque: FileCheck,
  CreditCard: CreditCard,
};
const METHOD_LABEL: Record<PaymentMethod, string> = {
  Cash: 'เงินสด',
  Transfer: 'โอน',
  Cheque: 'เช็ค',
  CreditCard: 'บัตรเครดิต',
};

export default function ReceiptsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [customerId, setCustomerId] = useState<string>('');
  const [method, setMethod] = useState<PaymentMethod | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['receipts', { page, search, customerId, method, dateFrom, dateTo }],
    queryFn: () => receiptsApi.list({
      page, pageSize: 20, search,
      customerId: customerId || undefined,
      method: method || undefined,
      from: dateFrom || undefined,
      to: dateTo || undefined,
    }),
  });

  const { data: customers } = useQuery({
    queryKey: ['customers-all'],
    queryFn: () => customersApi.list({ pageSize: 500 }),
  });

  const totalAmount = data?.items.reduce((sum, r) => sum + r.amount, 0) || 0;

  const columns: Column<ReceiptListItem>[] = [
    {
      key: 'receiptNo',
      header: 'เลขที่ใบเสร็จ',
      width: '160px',
      render: (r) => <span className="font-mono text-sm font-semibold">{r.receiptNo}</span>,
    },
    {
      key: 'date',
      header: 'วันที่',
      width: '110px',
      render: (r) => <span className="font-mono text-xs">{new Date(r.receiptDate).toLocaleDateString('th-TH')}</span>,
    },
    {
      key: 'invoice',
      header: 'อ้างอิง INV',
      render: (r) => <span className="font-mono text-xs">{r.invoiceNo || '—'}</span>,
    },
    {
      key: 'customer',
      header: 'ลูกค้า',
      render: (r) => <span className="text-[13px]">{r.customerName}</span>,
    },
    {
      key: 'method',
      header: 'วิธีชำระ',
      render: (r) => {
        const Icon = METHOD_ICONS[r.paymentMethod];
        return (
          <Pill variant="info">
            <Icon className="w-3 h-3" /> {METHOD_LABEL[r.paymentMethod]}
          </Pill>
        );
      },
    },
    {
      key: 'ref',
      header: 'อ้างอิง',
      render: (r) => <span className="font-mono text-xs text-mute">{r.paymentReference || '—'}</span>,
    },
    {
      key: 'amount',
      header: 'ยอดเงิน',
      align: 'right',
      render: (r) => <strong className="font-mono text-green-700">+฿{fmt.money(r.amount)}</strong>,
    },
  ];

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="การขาย · Receipts"
        title="ใบเสร็จ"
        em="รับเงิน"
        desc="ประวัติการรับชำระเงินทั้งหมด"
      />

      <div className="grid grid-cols-3 bg-white border border-rule rounded-xl overflow-hidden mb-5 shadow-sm">
        <div className="p-5 border-r border-rule">
          <div className="font-mono text-[10px] uppercase tracking-wider text-mute mb-2">จำนวนใบเสร็จ</div>
          <div className="editorial-num text-3xl text-ink">{data?.total || 0}</div>
        </div>
        <div className="p-5 border-r border-rule">
          <div className="font-mono text-[10px] uppercase tracking-wider text-mute mb-2">ยอดรับเงินรวม (ที่แสดง)</div>
          <div className="editorial-num text-3xl text-green-700">฿{fmt.money(totalAmount)}</div>
        </div>
        <div className="p-5">
          <div className="font-mono text-[10px] uppercase tracking-wider text-mute mb-2">เฉลี่ย/ใบ</div>
          <div className="editorial-num text-3xl text-ink">
            ฿{fmt.money(data?.items.length ? totalAmount / data.items.length : 0)}
          </div>
        </div>
      </div>

      <div className="bg-white border border-rule rounded-xl p-4 mb-5 grid grid-cols-6 gap-3">
        <div className="relative col-span-2">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-mute" />
          <Input
            placeholder="ค้นหาเลขที่, ลูกค้า, INV..."
            className="pl-10"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          value={customerId}
          onChange={(e) => { setCustomerId(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-rule-strong rounded-lg text-sm bg-white focus:outline-none focus:border-ink"
        >
          <option value="">ลูกค้าทั้งหมด</option>
          {customers?.items.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={method}
          onChange={(e) => { setMethod(e.target.value as PaymentMethod | ''); setPage(1); }}
          className="px-3 py-2 border border-rule-strong rounded-lg text-sm bg-white focus:outline-none focus:border-ink"
        >
          <option value="">ทุกวิธีชำระ</option>
          <option value="Cash">เงินสด</option>
          <option value="Transfer">โอน</option>
          <option value="Cheque">เช็ค</option>
          <option value="CreditCard">บัตรเครดิต</option>
        </select>
        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} placeholder="จาก" />
        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} placeholder="ถึง" />
      </div>

      <DataTable
        columns={columns}
        rows={data?.items || []}
        loading={isLoading}
        emptyMessage="ยังไม่มีใบเสร็จ — รับชำระจากหน้าใบขาย"
        pagination={{
          page,
          pageSize: 20,
          total: data?.total || 0,
          onPageChange: setPage,
        }}
      />
    </div>
  );
}
