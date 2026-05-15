import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Edit3, Download, AlertTriangle, Package } from 'lucide-react';
import { stocksApi } from '@/api/stocks.api';
import { branchesApi } from '@/api/branches.api';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Pill } from '@/components/ui/Pill';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { UpdateStockModal } from './UpdateStockModal';
import { fmt } from '@/lib/utils';
import type { StockListItem, StockStatus } from '@/api/types';

export default function StockPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [branchId, setBranchId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<StockStatus | ''>('');
  const [editingStock, setEditingStock] = useState<StockListItem | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['stocks', { page, search, branchId, statusFilter }],
    queryFn: () => stocksApi.list({
      page, pageSize: 20, search,
      branchId: branchId || undefined,
      status: statusFilter || undefined,
    }),
  });

  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchesApi.list(),
  });

  // KPI calculations
  const lowStockCount = data?.items.filter((s) => s.status === 'low').length || 0;
  const outOfStockCount = data?.items.filter((s) => s.status === 'out').length || 0;
  const totalValue = data?.items.reduce((sum, s) => sum + s.quantity * s.cost, 0) || 0;

  const columns: Column<StockListItem>[] = [
    {
      key: 'code',
      header: 'รหัส',
      width: '110px',
      render: (s) => <span className="font-mono text-xs">{s.productCode}</span>,
    },
    {
      key: 'product',
      header: 'สินค้า',
      render: (s) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-rust-soft to-rust-glow border border-rule grid place-items-center font-mono text-[10px] text-rust-dark flex-none">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <div className="font-medium text-[13px]">{s.productName}</div>
            <div className="text-[11px] text-mute mt-0.5">{s.brand || '—'}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'branch',
      header: 'สาขา',
      render: (s) => <Pill variant="muted">{s.branchName}</Pill>,
    },
    {
      key: 'qty',
      header: 'คงเหลือ',
      align: 'right',
      render: (s) => (
        <div className="text-right">
          <div className={`font-mono font-bold text-base ${s.status === 'out' ? 'text-rust' : s.status === 'low' ? 'text-yellow-700' : 'text-ink'}`}>
            {s.quantity}
          </div>
          <div className="text-[10px] text-mute font-mono">{s.unit}</div>
        </div>
      ),
    },
    {
      key: 'reorder',
      header: 'จุดสั่งซื้อ',
      align: 'right',
      render: (s) => <span className="font-mono text-xs text-mute">{s.reorderLevel}</span>,
    },
    {
      key: 'price',
      header: 'ทุน / ขาย',
      align: 'right',
      render: (s) => (
        <div className="text-right text-[12px] font-mono">
          <div className="text-mute">฿{fmt.money(s.cost)}</div>
          <div className="font-bold">฿{fmt.money(s.price)}</div>
        </div>
      ),
    },
    {
      key: 'value',
      header: 'มูลค่ารวม',
      align: 'right',
      render: (s) => (
        <span className="font-mono text-xs font-medium">฿{fmt.money(s.quantity * s.cost)}</span>
      ),
    },
    {
      key: 'status',
      header: 'สถานะ',
      render: (s) => (
        <Pill variant={s.status === 'ok' ? 'success' : s.status === 'low' ? 'warn' : 'danger'}>
          {s.status === 'ok' ? 'พร้อมขาย' : s.status === 'low' ? 'ใกล้หมด' : 'หมดสต็อก'}
        </Pill>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '100px',
      render: (s) => (
        <button
          onClick={() => setEditingStock(s)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs bg-paper-2 hover:bg-rust hover:text-white text-ink transition-colors"
        >
          <Edit3 className="w-3 h-3" /> ปรับสต็อก
        </button>
      ),
    },
  ];

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="คลังสินค้า · Stock Management"
        title="รายงาน"
        em="สต็อกสินค้า"
        desc="รายการสินค้าทั้งหมดในคลังพร้อมสถานะการจำหน่าย ครอบคลุมทุกสาขา"
        actions={
          <Button><Download className="w-3.5 h-3.5" /> ดาวน์โหลด PDF</Button>
        }
      />

      {/* KPI Summary */}
      <div className="grid grid-cols-4 bg-white border border-rule rounded-xl overflow-hidden mb-5 shadow-sm">
        <div className="p-5 border-r border-rule">
          <div className="font-mono text-[10px] uppercase tracking-wider text-mute mb-2">รายการที่แสดง</div>
          <div className="editorial-num text-3xl text-ink">{data?.total || 0}</div>
        </div>
        <div className="p-5 border-r border-rule">
          <div className="font-mono text-[10px] uppercase tracking-wider text-mute mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3 text-yellow-700" /> ใกล้หมด
          </div>
          <div className="editorial-num text-3xl text-yellow-700">{lowStockCount}</div>
        </div>
        <div className="p-5 border-r border-rule">
          <div className="font-mono text-[10px] uppercase tracking-wider text-mute mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3 text-rust" /> หมดสต็อก
          </div>
          <div className="editorial-num text-3xl text-rust">{outOfStockCount}</div>
        </div>
        <div className="p-5">
          <div className="font-mono text-[10px] uppercase tracking-wider text-mute mb-2">มูลค่าสต็อกรวม</div>
          <div className="editorial-num text-3xl text-ink">฿{fmt.money(totalValue)}</div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white border border-rule rounded-xl p-4 mb-5 flex gap-3 items-center flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-mute" />
          <Input
            placeholder="ค้นหาสินค้า, รหัส, ยี่ห้อ..."
            className="pl-10"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          value={branchId}
          onChange={(e) => { setBranchId(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-rule-strong rounded-lg text-sm bg-white min-w-[160px] focus:outline-none focus:border-ink"
        >
          <option value="">ทุกสาขา</option>
          {branches?.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as StockStatus | ''); setPage(1); }}
          className="px-3 py-2 border border-rule-strong rounded-lg text-sm bg-white min-w-[140px] focus:outline-none focus:border-ink"
        >
          <option value="">ทุกสถานะ</option>
          <option value="ok">พร้อมขาย</option>
          <option value="low">ใกล้หมด</option>
          <option value="out">หมดสต็อก</option>
        </select>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        rows={data?.items || []}
        loading={isLoading}
        pagination={{
          page,
          pageSize: 20,
          total: data?.total || 0,
          onPageChange: setPage,
        }}
      />

      {/* Update Stock Modal */}
      <UpdateStockModal
        open={!!editingStock}
        stock={editingStock}
        onClose={() => setEditingStock(null)}
      />
    </div>
  );
}
