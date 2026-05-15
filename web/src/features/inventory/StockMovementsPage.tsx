import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, ArrowDown, ArrowUp, RefreshCw, Download } from 'lucide-react';
import { stockMovementsApi } from '@/api/stocks.api';
import { branchesApi } from '@/api/branches.api';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Pill } from '@/components/ui/Pill';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { fmt } from '@/lib/utils';
import type { StockMovement, MovementDirection } from '@/api/types';

const directionConfig: Record<MovementDirection, { label: string; variant: 'success' | 'rust' | 'info'; Icon: any }> = {
  In: { label: 'เข้า', variant: 'success', Icon: ArrowDown },
  Out: { label: 'ออก', variant: 'rust', Icon: ArrowUp },
  Adjust: { label: 'ปรับ', variant: 'info', Icon: RefreshCw },
};

const refTypeLabels: Record<string, string> = {
  Receiving: 'รับสินค้า',
  SalesOrder: 'ใบขาย',
  Manual: 'ปรับด้วยตนเอง',
  Adjustment: 'ปรับสมดุล',
};

export default function StockMovementsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [branchId, setBranchId] = useState<string>('');
  const [direction, setDirection] = useState<MovementDirection | ''>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const { data, isLoading } = useQuery({
    queryKey: ['stock-movements', { page, search, branchId, direction, dateFrom, dateTo }],
    queryFn: () => stockMovementsApi.list({
      page, pageSize: 30, search,
      branchId: branchId || undefined,
      direction: direction || undefined,
      from: dateFrom || undefined,
      to: dateTo || undefined,
    }),
  });

  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchesApi.list(),
  });

  const columns: Column<StockMovement>[] = [
    {
      key: 'date',
      header: 'วันที่ · เวลา',
      width: '160px',
      render: (m) => (
        <div className="font-mono text-xs">
          <div>{new Date(m.createdAt).toLocaleDateString('th-TH')}</div>
          <div className="text-mute text-[10px]">{new Date(m.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      ),
    },
    {
      key: 'direction',
      header: 'ทิศทาง',
      render: (m) => {
        const cfg = directionConfig[m.direction];
        return (
          <Pill variant={cfg.variant}>
            <cfg.Icon className="w-3 h-3" /> {cfg.label}
          </Pill>
        );
      },
    },
    {
      key: 'product',
      header: 'สินค้า',
      render: (m) => (
        <div>
          <div className="font-medium text-[13px]">{m.productName}</div>
          <div className="font-mono text-[10px] text-mute mt-0.5">{m.productCode}</div>
        </div>
      ),
    },
    {
      key: 'qty',
      header: 'จำนวน',
      align: 'right',
      render: (m) => (
        <span className={`font-mono font-bold ${m.direction === 'In' ? 'text-green-700' : 'text-rust'}`}>
          {m.direction === 'In' ? '+' : '−'}{m.quantity}
        </span>
      ),
    },
    {
      key: 'price',
      header: 'ราคา/หน่วย',
      align: 'right',
      render: (m) => m.unitPrice ? <span className="font-mono text-xs">฿{fmt.money(m.unitPrice)}</span> : <span className="text-mute">—</span>,
    },
    {
      key: 'branch',
      header: 'สาขา',
      render: (m) => <Pill variant="muted">{m.branchName}</Pill>,
    },
    {
      key: 'ref',
      header: 'อ้างอิง',
      render: (m) => (
        <div>
          <div className="font-mono text-xs">{m.referenceNo || '—'}</div>
          <div className="text-[10px] text-mute mt-0.5">{refTypeLabels[m.referenceType] || m.referenceType}</div>
        </div>
      ),
    },
    {
      key: 'note',
      header: 'หมายเหตุ',
      render: (m) => <span className="text-[12px] text-mute italic">{m.note || '—'}</span>,
    },
  ];

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="คลังสินค้า · Movement History"
        title="ประวัติ"
        em="การเคลื่อนไหวสต็อก"
        desc="บันทึกการเข้า-ออก-ปรับสต็อกทั้งหมดในระบบ พร้อมเอกสารอ้างอิง"
        actions={<Button><Download className="w-3.5 h-3.5" /> ดาวน์โหลด PDF</Button>}
      />

      {/* Filters */}
      <div className="bg-white border border-rule rounded-xl p-4 mb-5 grid grid-cols-6 gap-3">
        <div className="relative col-span-2">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-mute" />
          <Input
            placeholder="ค้นหาสินค้า, เลขอ้างอิง..."
            className="pl-10"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          value={direction}
          onChange={(e) => { setDirection(e.target.value as MovementDirection | ''); setPage(1); }}
          className="px-3 py-2 border border-rule-strong rounded-lg text-sm bg-white focus:outline-none focus:border-ink"
        >
          <option value="">ทุกทิศทาง</option>
          <option value="In">เข้า</option>
          <option value="Out">ออก</option>
          <option value="Adjust">ปรับ</option>
        </select>
        <select
          value={branchId}
          onChange={(e) => { setBranchId(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-rule-strong rounded-lg text-sm bg-white focus:outline-none focus:border-ink"
        >
          <option value="">ทุกสาขา</option>
          {branches?.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} placeholder="จาก" />
        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} placeholder="ถึง" />
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        rows={data?.items || []}
        loading={isLoading}
        emptyMessage="ยังไม่มีประวัติการเคลื่อนไหวสต็อก"
        pagination={{
          page,
          pageSize: 30,
          total: data?.total || 0,
          onPageChange: setPage,
        }}
      />
    </div>
  );
}
