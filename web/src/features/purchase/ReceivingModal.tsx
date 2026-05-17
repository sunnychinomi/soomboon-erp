import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Inbox, Package, AlertCircle } from 'lucide-react';
import { purchaseOrdersApi } from '@/api/purchase-orders.api';
import { receivingsApi } from '@/api/receivings.api';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Field } from '@/components/ui/Input';
import { Pill } from '@/components/ui/Pill';
import { toast } from '@/components/ui/Toast';
import { fmt, cn } from '@/lib/utils';

interface ReceivingModalProps {
  open: boolean;
  onClose: () => void;
}

interface LineState {
  poItemId: string;
  productName: string;
  productCode: string | null;
  ordered: number;
  alreadyReceived: number;
  remaining: number;
  unitPrice: number;
  receivedNow: number;
}

export function ReceivingModal({ open, onClose }: ReceivingModalProps) {
  const qc = useQueryClient();
  const [selectedPoId, setSelectedPoId] = useState<string>('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [vendorInvoiceNo, setVendorInvoiceNo] = useState('');
  const [note, setNote] = useState('');
  const [lines, setLines] = useState<LineState[]>([]);

  // Fetch open POs (Pending + Partial)
  const { data: pendingPos } = useQuery({
    queryKey: ['purchase-orders-open'],
    queryFn: () => purchaseOrdersApi.list({ status: 'Pending', pageSize: 100 }),
    enabled: open,
  });
  const { data: partialPos } = useQuery({
    queryKey: ['purchase-orders-partial'],
    queryFn: () => purchaseOrdersApi.list({ status: 'Partial', pageSize: 100 }),
    enabled: open,
  });

  const availablePOs = [
    ...(pendingPos?.items || []),
    ...(partialPos?.items || []),
  ];

  // Fetch selected PO details
  const { data: po } = useQuery({
    queryKey: ['purchase-order', selectedPoId],
    queryFn: () => purchaseOrdersApi.get(selectedPoId),
    enabled: !!selectedPoId,
  });

  useEffect(() => {
    if (po) {
      setLines(po.items.map((i) => ({
        poItemId: i.id,
        productName: i.productName,
        productCode: i.productCode,
        ordered: i.quantity,
        alreadyReceived: i.receivedQuantity,
        remaining: i.quantity - i.receivedQuantity,
        unitPrice: i.unitPrice,
        receivedNow: Math.max(0, i.quantity - i.receivedQuantity), // default = receive all remaining
      })));
    } else {
      setLines([]);
    }
  }, [po]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setSelectedPoId('');
      setVendorInvoiceNo('');
      setNote('');
      setLines([]);
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [open]);

  const totalAmount = lines.reduce((sum, l) => sum + l.receivedNow * l.unitPrice, 0);
  const totalItems = lines.filter((l) => l.receivedNow > 0).length;
  const willCompletePo = lines.every((l) => l.receivedNow >= l.remaining);

  const createMut = useMutation({
    mutationFn: receivingsApi.create,
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['receivings'] });
      qc.invalidateQueries({ queryKey: ['purchase-orders'] });
      qc.invalidateQueries({ queryKey: ['purchase-order'] });
      qc.invalidateQueries({ queryKey: ['stocks'] });
      qc.invalidateQueries({ queryKey: ['stock-movements'] });
      toast.success(`รับสินค้าเรียบร้อย ${r.receivingNo}`);
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'รับสินค้าไม่สำเร็จ'),
  });

  const handleSubmit = () => {
    if (!selectedPoId) return toast.error('กรุณาเลือก PO');
    const itemsToReceive = lines.filter((l) => l.receivedNow > 0);
    if (itemsToReceive.length === 0) return toast.error('กรุณากำหนดจำนวนรับอย่างน้อย 1 รายการ');

    createMut.mutate({
      purchaseOrderId: selectedPoId,
      receivingDate: date,
      vendorInvoiceNo: vendorInvoiceNo || null,
      note: note || null,
      items: itemsToReceive.map((l) => ({
        purchaseOrderItemId: l.poItemId,
        receivedQty: l.receivedNow,
      })),
    });
  };

  const updateLine = (id: string, qty: number) => {
    setLines((prev) => prev.map((l) => l.poItemId === id
      ? { ...l, receivedNow: Math.max(0, Math.min(l.remaining, qty)) }
      : l
    ));
  };

  const setAllRemaining = () => {
    setLines((prev) => prev.map((l) => ({ ...l, receivedNow: l.remaining })));
  };
  const clearAll = () => {
    setLines((prev) => prev.map((l) => ({ ...l, receivedNow: 0 })));
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="รับสินค้าเข้าคลัง"
      description="เลือกใบสั่งซื้อและกำหนดจำนวนที่ได้รับ — สต็อกจะอัปเดตอัตโนมัติ"
      size="xl"
      footer={
        <>
          <Button onClick={onClose}>ยกเลิก</Button>
          <Button
            variant="rust"
            onClick={handleSubmit}
            disabled={createMut.isPending || !selectedPoId || totalItems === 0}
          >
            <Inbox className="w-3.5 h-3.5" />
            {createMut.isPending ? 'กำลังบันทึก...' : `บันทึกการรับสินค้า (${totalItems} รายการ)`}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Header info */}
        <div className="grid grid-cols-3 gap-4">
          <Field label="เลือกใบสั่งซื้อ (PO)">
            <select
              value={selectedPoId}
              onChange={(e) => setSelectedPoId(e.target.value)}
              className="w-full px-3 py-2.5 border border-rule-strong rounded-lg text-sm bg-white focus:outline-none focus:border-ink"
            >
              <option value="">— เลือก PO —</option>
              {availablePOs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.poNo} · {p.vendorName} · ฿{fmt.money(p.total)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="วันที่รับสินค้า">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="เลขที่บิลผู้ขาย">
            <Input
              value={vendorInvoiceNo}
              onChange={(e) => setVendorInvoiceNo(e.target.value)}
              placeholder="INV-K1289"
            />
          </Field>
        </div>

        {!selectedPoId && (
          <div className="text-center py-12 bg-paper-2 rounded-xl text-mute border border-dashed border-rule">
            <Inbox className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium">เลือก PO ที่ต้องการรับสินค้า</p>
            <p className="text-xs mt-1">จะแสดง PO ที่มีสถานะ "รอดำเนินการ" หรือ "รับบางส่วน" เท่านั้น</p>
          </div>
        )}

        {po && (
          <>
            {/* PO summary */}
            <div className="bg-paper-2 rounded-xl p-4 grid grid-cols-4 gap-4">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-mute">ผู้ขาย</div>
                <div className="font-medium text-sm mt-0.5">{po.vendorName}</div>
              </div>
              <div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-mute">สาขาที่รับ</div>
                <div className="font-medium text-sm mt-0.5">{po.branchName || '—'}</div>
              </div>
              <div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-mute">มูลค่า PO</div>
                <div className="font-mono text-sm mt-0.5">฿{fmt.money(po.total)}</div>
              </div>
              <div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-mute">สถานะ</div>
                <div className="mt-1">
                  <Pill variant={po.status === 'Pending' ? 'warn' : 'info'}>
                    {po.status === 'Pending' ? 'รอดำเนินการ' : 'รับบางส่วน'}
                  </Pill>
                </div>
              </div>
            </div>

            {/* Items table */}
            <div className="bg-white border border-rule rounded-xl">
              <div className="flex items-center justify-between p-4 border-b border-rule">
                <h4 className="font-display font-semibold">รายการสินค้าที่จะรับ</h4>
                <div className="flex gap-2">
                  <Button size="sm" type="button" onClick={clearAll}>ล้างทั้งหมด</Button>
                  <Button size="sm" variant="primary" type="button" onClick={setAllRemaining}>
                    รับครบที่เหลือ
                  </Button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-paper">
                    <tr>
                      <th className="text-left font-mono text-[10px] tracking-wider uppercase text-mute px-4 py-3">สินค้า</th>
                      <th className="text-right font-mono text-[10px] tracking-wider uppercase text-mute px-4 py-3 w-24">สั่ง</th>
                      <th className="text-right font-mono text-[10px] tracking-wider uppercase text-mute px-4 py-3 w-24">รับแล้ว</th>
                      <th className="text-right font-mono text-[10px] tracking-wider uppercase text-mute px-4 py-3 w-24">คงเหลือ</th>
                      <th className="text-center font-mono text-[10px] tracking-wider uppercase text-mute px-4 py-3 w-32">รับครั้งนี้</th>
                      <th className="text-right font-mono text-[10px] tracking-wider uppercase text-mute px-4 py-3 w-28">ราคา</th>
                      <th className="text-right font-mono text-[10px] tracking-wider uppercase text-mute px-4 py-3 w-32">รวม</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((l) => {
                      const lineTotal = l.receivedNow * l.unitPrice;
                      return (
                        <tr key={l.poItemId} className={cn(
                          'border-b border-rule last:border-0',
                          l.receivedNow > 0 && 'bg-green-50/30',
                          l.remaining === 0 && 'opacity-50',
                        )}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Package className="w-4 h-4 text-mute" />
                              <div>
                                <div className="font-medium text-[13px]">{l.productName}</div>
                                {l.productCode && (
                                  <div className="font-mono text-[10px] text-mute mt-0.5">{l.productCode}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-sm">{l.ordered}</td>
                          <td className="px-4 py-3 text-right font-mono text-sm text-mute">{l.alreadyReceived}</td>
                          <td className="px-4 py-3 text-right">
                            <span className={cn(
                              'font-mono text-sm font-bold',
                              l.remaining === 0 ? 'text-green-700' : 'text-rust',
                            )}>{l.remaining}</span>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              value={l.receivedNow}
                              min="0"
                              max={l.remaining}
                              disabled={l.remaining === 0}
                              onChange={(e) => updateLine(l.poItemId, parseInt(e.target.value || '0'))}
                              className="w-full px-2 py-1.5 border border-rule-strong rounded text-sm text-center font-mono focus:outline-none focus:border-rust focus:bg-white"
                            />
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-xs">฿{fmt.money(l.unitPrice)}</td>
                          <td className="px-4 py-3 text-right font-mono text-sm font-bold">
                            {l.receivedNow > 0 ? `฿${fmt.money(lineTotal)}` : <span className="text-mute">—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Footer summary */}
              <div className="p-4 border-t border-rule bg-paper flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {willCompletePo && totalItems > 0 ? (
                    <Pill variant="success">PO นี้จะรับครบหลังบันทึก</Pill>
                  ) : totalItems > 0 ? (
                    <Pill variant="info">รับบางส่วน — PO ยังคงเปิดอยู่</Pill>
                  ) : (
                    <span className="text-xs text-mute">ยังไม่ได้กำหนดจำนวนรับ</span>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-mute">รวมยอดรับ</div>
                  <div className="editorial-num text-2xl text-rust">฿{fmt.money(totalAmount)}</div>
                </div>
              </div>
            </div>

            {/* Note */}
            <Field label="หมายเหตุ">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="เช่น: รับครบทุกชิ้น, ของชำรุด 2 ชิ้น..."
                rows={2}
                className="w-full px-3 py-2.5 border border-rule-strong rounded-lg bg-white text-sm focus:outline-none focus:border-ink"
              />
            </Field>

            {/* Warning */}
            {!po.branchId && (
              <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs">
                <AlertCircle className="w-4 h-4 text-yellow-700 flex-none mt-0.5" />
                <div className="text-yellow-900">
                  <strong>คำเตือน:</strong> PO นี้ยังไม่ได้ระบุสาขาที่รับ — สต็อกจะไม่ถูกบันทึก
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
