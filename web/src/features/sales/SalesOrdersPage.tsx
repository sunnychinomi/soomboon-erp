import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Eye, Receipt as ReceiptIcon, AlertCircle } from 'lucide-react';
import { salesOrdersApi } from '@/api/sales-orders.api';
import { customersApi } from '@/api/customers.api';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Pill } from '@/components/ui/Pill';
import { DataTable, type Column } from '@/components/ui/DataTable';
import SalesOrderEditor from './SalesOrderEditor';
import { fmt } from '@/lib/utils';
import type { SalesOrderListItem, SalesOrderStatus } from '@/api/types';

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

export default function SalesOrdersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<SalesOrderStatus | ''>('');
  const [customerId, setCustomerId] = useState<string>('');
  const [view, setView] = useState<'list' | { mode: 'edit' | 'new'; id: string }>('list');

  const { data, isLoading } = useQuery({
    queryKey: ['sales-orders', { page, search, statusFilter, customerId }],
    queryFn: () => salesOrdersApi.list({
      page, pageSize: 20, search,
      status: statusFilter || undefined,
      customerId: customerId || undefined,
    }),
    enabled: view === 'list',
  });

  const { data: customers } = useQuery({
    queryKey: ['customers-all'],
    queryFn: () => customersApi.list({ pageSize: 500 }),
  });

  if (view !== 'list') {
    return (
      <SalesOrderEditor
        soId={view.mode === 'new' ? 'new' : view.id}
        onBack={() => setView('list')}
      />
    );
  }

  // KPI
  const todayStr = new Date().toISOString().split('T')[0];
  const todayCount = data?.items.filter((s) => s.orderDate.startsWith(todayStr)).length || 0;
  const unpaidCount = data?.items.filter((s) => s.status === 'Unpaid' || s.status === 'Partial').length || 0;
  const unpaidAmount = data?.items
    .filter((s) => s.status !== 'Cancelled' && s.status !== 'Paid')
    .reduce((sum, s) => sum + s.balance, 0) || 0;
  const totalRevenue = data?.items
    .filter((s) => s.status !== 'Cancelled')
    .reduce((sum, s) => sum + s.total, 0) || 0;

  const columns: Column<SalesOrderListItem>[] = [
    {
      key: 'invoiceNo',
      header: 'เลขที่',
      width: '150px',
      render: (s) => <span className="font-mono text-sm font-semibold text-ink">{s.invoiceNo}</span>,
    },
    {
      key: 'date',
      header: 'วันที่',
      width: '110px',
      render: (s) => (
        <span className="font-mono text-xs">{new Date(s.orderDate).toLocaleDateString('th-TH')}</span>
      ),
    },
    {
      key: 'customer',
      header: 'ลูกค้า',
      render: (s) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-rust-soft to-rust-glow border border-rule grid place-items-center font-mono text-[10px] text-rust-dark flex-none">
            {s.customerName.substring(0, 2)}
          </div>
          <div className="font-medium text-[13px]">{s.customerName}</div>
        </div>
      ),
    },
    {
      key: 'branch',
      header: 'สาขา',
      render: (s) => <Pill variant="muted">{s.branchName || '—'}</Pill>,
    },
    {
      key: 'items',
      header: 'รายการ',
      align: 'right',
      render: (s) => <span className="font-mono">{s.itemCount}</span>,
    },
    {
      key: 'total',
      header: 'มูลค่า',
      align: 'right',
      render: (s) => <strong className="font-mono">฿{fmt.money(s.total)}</strong>,
    },
    {
      key: 'paid',
      header: 'ชำระ / ค้าง',
      align: 'right',
      render: (s) => (
        <div className="text-right text-xs font-mono">
          <div className="text-green-700">฿{fmt.money(s.paidAmount)}</div>
          {s.balance > 0 && <div className="text-rust font-bold">฿{fmt.money(s.balance)}</div>}
        </div>
      ),
    },
    {
      key: 'due',
      header: 'ครบกำหนด',
      render: (s) => {
        if (!s.dueDate) return <span className="text-mute text-xs">—</span>;
        const overdue = s.balance > 0 && new Date(s.dueDate) < new Date();
        return (
          <span className={`font-mono text-xs ${overdue ? 'text-burgundy font-semibold' : 'text-mute'}`}>
            {overdue && <AlertCircle className="w-3 h-3 inline mr-1" />}
            {new Date(s.dueDate).toLocaleDateString('th-TH')}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'สถานะ',
      render: (s) => <Pill variant={STATUS_VARIANT[s.status]}>{STATUS_LABEL[s.status]}</Pill>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '80px',
      render: (s) => (
        <button
          onClick={() => setView({ mode: 'edit', id: s.id })}
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
        eyebrow="การขาย · Sales Orders"
        title="ใบขาย"
        em="สินค้า"
        desc="รายการใบขาย/ใบกำกับภาษีทั้งหมด พร้อมสถานะการชำระเงิน"
        actions={
          <Button variant="rust" onClick={() => setView({ mode: 'new', id: 'new' })}>
            <Plus className="w-3.5 h-3.5" /> สร้างใบขาย
          </Button>
        }
      />

      {/* KPI */}
      <div className="grid grid-cols-4 bg-white border border-rule rounded-xl overflow-hidden mb-5 shadow-sm">
        <div className="p-5 border-r border-rule">
          <div className="font-mono text-[10px] uppercase tracking-wider text-mute mb-2">จำนวน SO ที่แสดง</div>
          <div className="editorial-num text-3xl text-ink">{data?.total || 0}</div>
        </div>
        <div className="p-5 border-r border-rule">
          <div className="font-mono text-[10px] uppercase tracking-wider text-mute mb-2">วันนี้</div>
          <div className="editorial-num text-3xl text-rust">{todayCount}</div>
        </div>
        <div className="p-5 border-r border-rule">
          <div className="font-mono text-[10px] uppercase tracking-wider text-mute mb-2">รายการค้างชำระ</div>
          <div className="editorial-num text-3xl text-yellow-700">{unpaidCount}</div>
        </div>
        <div className="p-5">
          <div className="font-mono text-[10px] uppercase tracking-wider text-mute mb-2">ยอดค้างชำระรวม</div>
          <div className="editorial-num text-3xl text-rust">฿{fmt.money(unpaidAmount)}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-rule rounded-xl p-4 mb-5 flex gap-3 items-center flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-mute" />
          <Input
            placeholder="ค้นหาเลขที่ INV, ลูกค้า, หมายเหตุ..."
            className="pl-10"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as SalesOrderStatus | ''); setPage(1); }}
          className="px-3 py-2 border border-rule-strong rounded-lg text-sm bg-white min-w-[160px] focus:outline-none focus:border-ink"
        >
          <option value="">ทุกสถานะ</option>
          <option value="Unpaid">ค้างชำระ</option>
          <option value="Partial">ชำระบางส่วน</option>
          <option value="Paid">ชำระแล้ว</option>
          <option value="Cancelled">ยกเลิก</option>
        </select>
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
        <div className="text-xs font-mono text-mute tracking-wider ml-auto">
          ยอดขายรวม: <strong className="text-ink">฿{fmt.money(totalRevenue)}</strong>
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={data?.items || []}
        loading={isLoading}
        emptyMessage="ยังไม่มีใบขาย — คลิก 'สร้างใบขาย' เพื่อเริ่ม"
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
