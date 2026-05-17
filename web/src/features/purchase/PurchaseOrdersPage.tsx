import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, FileText, Eye } from 'lucide-react';
import { purchaseOrdersApi } from '@/api/purchase-orders.api';
import { vendorsApi } from '@/api/vendors.api';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Pill } from '@/components/ui/Pill';
import { DataTable, type Column } from '@/components/ui/DataTable';
import PurchaseOrderEditor from './PurchaseOrderEditor';
import { fmt } from '@/lib/utils';
import type { PurchaseOrderListItem, PoStatus } from '@/api/types';

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

export default function PurchaseOrdersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<PoStatus | ''>('');
  const [vendorId, setVendorId] = useState<string>('');
  const [view, setView] = useState<'list' | { mode: 'edit' | 'new'; id: string }>('list');

  const { data, isLoading } = useQuery({
    queryKey: ['purchase-orders', { page, search, statusFilter, vendorId }],
    queryFn: () => purchaseOrdersApi.list({
      page, pageSize: 20, search,
      status: statusFilter || undefined,
      vendorId: vendorId || undefined,
    }),
    enabled: view === 'list',
  });

  const { data: vendors } = useQuery({
    queryKey: ['vendors-all'],
    queryFn: () => vendorsApi.list({ pageSize: 200 }),
  });

  if (view !== 'list') {
    return (
      <PurchaseOrderEditor
        poId={view.mode === 'new' ? 'new' : view.id}
        onBack={() => setView('list')}
      />
    );
  }

  // KPI
  const pendingCount = data?.items.filter((p) => p.status === 'Pending').length || 0;
  const partialCount = data?.items.filter((p) => p.status === 'Partial').length || 0;
  const totalValue = data?.items
    .filter((p) => p.status !== 'Cancelled')
    .reduce((sum, p) => sum + p.total, 0) || 0;

  const columns: Column<PurchaseOrderListItem>[] = [
    {
      key: 'poNo',
      header: 'เลขที่',
      width: '140px',
      render: (p) => <span className="font-mono text-sm font-semibold text-ink">{p.poNo}</span>,
    },
    {
      key: 'date',
      header: 'วันที่',
      width: '120px',
      render: (p) => (
        <span className="font-mono text-xs">
          {new Date(p.poDate).toLocaleDateString('th-TH')}
        </span>
      ),
    },
    {
      key: 'vendor',
      header: 'ผู้ขาย',
      render: (p) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-steel-glow to-steel-soft border border-rule grid place-items-center font-mono text-[10px] text-indigo flex-none">
            <FileText className="w-4 h-4" />
          </div>
          <div className="font-medium text-[13px]">{p.vendorName || '—'}</div>
        </div>
      ),
    },
    {
      key: 'branch',
      header: 'สาขา',
      render: (p) => <Pill variant="muted">{p.branchName || '—'}</Pill>,
    },
    {
      key: 'items',
      header: 'รายการ',
      align: 'right',
      render: (p) => <span className="font-mono">{p.itemCount}</span>,
    },
    {
      key: 'total',
      header: 'มูลค่า',
      align: 'right',
      render: (p) => <strong className="font-mono">฿{fmt.money(p.total)}</strong>,
    },
    {
      key: 'status',
      header: 'สถานะ',
      render: (p) => <Pill variant={STATUS_VARIANT[p.status]}>{STATUS_LABEL[p.status]}</Pill>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '90px',
      render: (p) => (
        <button
          onClick={() => setView({ mode: 'edit', id: p.id })}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs bg-paper-2 hover:bg-ink hover:text-white text-ink transition-colors"
        >
          <Eye className="w-3 h-3" /> ดู
        </button>
      ),
    },
  ];

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="จัดซื้อ · Purchase Orders"
        title="ใบ"
        em="สั่งซื้อ"
        desc="รายการคำสั่งซื้อทั้งหมดที่ออกให้ผู้ขาย พร้อมสถานะการรับสินค้า"
        actions={
          <Button variant="rust" onClick={() => setView({ mode: 'new', id: 'new' })}>
            <Plus className="w-3.5 h-3.5" /> สร้างใบสั่งซื้อ
          </Button>
        }
      />

      {/* KPI */}
      <div className="grid grid-cols-4 bg-white border border-rule rounded-xl overflow-hidden mb-5 shadow-sm">
        <div className="p-5 border-r border-rule">
          <div className="font-mono text-[10px] uppercase tracking-wider text-mute mb-2">จำนวน PO ที่แสดง</div>
          <div className="editorial-num text-3xl text-ink">{data?.total || 0}</div>
        </div>
        <div className="p-5 border-r border-rule">
          <div className="font-mono text-[10px] uppercase tracking-wider text-mute mb-2">รอดำเนินการ</div>
          <div className="editorial-num text-3xl text-yellow-700">{pendingCount}</div>
        </div>
        <div className="p-5 border-r border-rule">
          <div className="font-mono text-[10px] uppercase tracking-wider text-mute mb-2">รับบางส่วน</div>
          <div className="editorial-num text-3xl text-indigo">{partialCount}</div>
        </div>
        <div className="p-5">
          <div className="font-mono text-[10px] uppercase tracking-wider text-mute mb-2">มูลค่ารวม (ไม่นับยกเลิก)</div>
          <div className="editorial-num text-3xl text-ink">฿{fmt.money(totalValue)}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-rule rounded-xl p-4 mb-5 flex gap-3 items-center flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-mute" />
          <Input
            placeholder="ค้นหาเลขที่ PO, ผู้ขาย, หมายเหตุ..."
            className="pl-10"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as PoStatus | ''); setPage(1); }}
          className="px-3 py-2 border border-rule-strong rounded-lg text-sm bg-white min-w-[160px] focus:outline-none focus:border-ink"
        >
          <option value="">ทุกสถานะ</option>
          <option value="Pending">รอดำเนินการ</option>
          <option value="Partial">รับบางส่วน</option>
          <option value="Received">รับครบ</option>
          <option value="Cancelled">ยกเลิก</option>
        </select>
        <select
          value={vendorId}
          onChange={(e) => { setVendorId(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-rule-strong rounded-lg text-sm bg-white min-w-[200px] focus:outline-none focus:border-ink"
        >
          <option value="">ผู้ขายทั้งหมด</option>
          {vendors?.items.map((v) => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        rows={data?.items || []}
        loading={isLoading}
        emptyMessage="ยังไม่มีใบสั่งซื้อ — คลิก 'สร้างใบสั่งซื้อ' เพื่อเริ่ม"
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
