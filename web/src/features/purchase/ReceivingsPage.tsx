import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Inbox, FileText } from 'lucide-react';
import { receivingsApi } from '@/api/receivings.api';
import { branchesApi } from '@/api/branches.api';
import { vendorsApi } from '@/api/vendors.api';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Pill } from '@/components/ui/Pill';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { ReceivingModal } from './ReceivingModal';
import { fmt } from '@/lib/utils';
import type { ReceivingListItem } from '@/api/types';

export default function ReceivingsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [vendorId, setVendorId] = useState<string>('');
  const [branchId, setBranchId] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [openModal, setOpenModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['receivings', { page, search, vendorId, branchId, dateFrom, dateTo }],
    queryFn: () => receivingsApi.list({
      page, pageSize: 20, search,
      vendorId: vendorId || undefined,
      branchId: branchId || undefined,
      from: dateFrom || undefined,
      to: dateTo || undefined,
    }),
  });

  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchesApi.list(),
  });
  const { data: vendors } = useQuery({
    queryKey: ['vendors-all'],
    queryFn: () => vendorsApi.list({ pageSize: 200 }),
  });

  // KPI
  const totalAmount = data?.items.reduce((sum, r) => sum + r.amount, 0) || 0;
  const completeCount = data?.items.filter((r) => r.status === 'Complete').length || 0;
  const partialCount = data?.items.filter((r) => r.status === 'Partial').length || 0;

  const columns: Column<ReceivingListItem>[] = [
    {
      key: 'no',
      header: 'เลขที่',
      width: '140px',
      render: (r) => <span className="font-mono text-sm font-semibold">{r.receivingNo}</span>,
    },
    {
      key: 'date',
      header: 'วันที่รับ',
      width: '110px',
      render: (r) => <span className="font-mono text-xs">{new Date(r.receivingDate).toLocaleDateString('th-TH')}</span>,
    },
    {
      key: 'po',
      header: 'อ้างอิง PO',
      render: (r) => (
        <div className="flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-mute" />
          <span className="font-mono text-xs">{r.purchaseOrderNo || '—'}</span>
        </div>
      ),
    },
    {
      key: 'vendor',
      header: 'ผู้ขาย',
      render: (r) => <span className="text-[13px]">{r.vendorName || '—'}</span>,
    },
    {
      key: 'invoice',
      header: 'เลขบิลผู้ขาย',
      render: (r) => <span className="font-mono text-xs text-mute">{r.vendorInvoiceNo || '—'}</span>,
    },
    {
      key: 'branch',
      header: 'สาขา',
      render: (r) => <Pill variant="muted">{r.branchName || '—'}</Pill>,
    },
    {
      key: 'items',
      header: 'รายการ',
      align: 'right',
      render: (r) => <span className="font-mono">{r.itemCount}</span>,
    },
    {
      key: 'amount',
      header: 'มูลค่า',
      align: 'right',
      render: (r) => <strong className="font-mono">฿{fmt.money(r.amount)}</strong>,
    },
    {
      key: 'status',
      header: 'สถานะ',
      render: (r) => (
        <Pill variant={r.status === 'Complete' ? 'success' : 'info'}>
          {r.status === 'Complete' ? 'รับครบ' : 'รับบางส่วน'}
        </Pill>
      ),
    },
  ];

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="จัดซื้อ · Goods Receiving"
        title="รับ"
        em="สินค้า"
        desc="บันทึกการรับสินค้าจากใบสั่งซื้อ — สต็อกจะอัปเดตอัตโนมัติเมื่อบันทึก"
        actions={
          <Button variant="rust" onClick={() => setOpenModal(true)}>
            <Plus className="w-3.5 h-3.5" /> รับสินค้าใหม่
          </Button>
        }
      />

      {/* KPI */}
      <div className="grid grid-cols-4 bg-white border border-rule rounded-xl overflow-hidden mb-5 shadow-sm">
        <div className="p-5 border-r border-rule">
          <div className="font-mono text-[10px] uppercase tracking-wider text-mute mb-2">รายการรับ</div>
          <div className="editorial-num text-3xl text-ink">{data?.total || 0}</div>
        </div>
        <div className="p-5 border-r border-rule">
          <div className="font-mono text-[10px] uppercase tracking-wider text-mute mb-2">รับครบ</div>
          <div className="editorial-num text-3xl text-green-700">{completeCount}</div>
        </div>
        <div className="p-5 border-r border-rule">
          <div className="font-mono text-[10px] uppercase tracking-wider text-mute mb-2">รับบางส่วน</div>
          <div className="editorial-num text-3xl text-indigo">{partialCount}</div>
        </div>
        <div className="p-5">
          <div className="font-mono text-[10px] uppercase tracking-wider text-mute mb-2">มูลค่ารับเข้ารวม</div>
          <div className="editorial-num text-3xl text-ink">฿{fmt.money(totalAmount)}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-rule rounded-xl p-4 mb-5 grid grid-cols-6 gap-3">
        <div className="relative col-span-2">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-mute" />
          <Input
            placeholder="ค้นหาเลขที่รับ, PO, บิลผู้ขาย..."
            className="pl-10"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          value={vendorId}
          onChange={(e) => { setVendorId(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-rule-strong rounded-lg text-sm bg-white focus:outline-none focus:border-ink"
        >
          <option value="">ผู้ขายทั้งหมด</option>
          {vendors?.items.map((v) => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
        <select
          value={branchId}
          onChange={(e) => { setBranchId(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-rule-strong rounded-lg text-sm bg-white focus:outline-none focus:border-ink"
        >
          <option value="">สาขาทั้งหมด</option>
          {branches?.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} placeholder="จาก" />
        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} placeholder="ถึง" />
      </div>

      <DataTable
        columns={columns}
        rows={data?.items || []}
        loading={isLoading}
        emptyMessage="ยังไม่มีการรับสินค้า — คลิก 'รับสินค้าใหม่' เพื่อเริ่ม"
        pagination={{
          page,
          pageSize: 20,
          total: data?.total || 0,
          onPageChange: setPage,
        }}
      />

      <ReceivingModal open={openModal} onClose={() => setOpenModal(false)} />
    </div>
  );
}
