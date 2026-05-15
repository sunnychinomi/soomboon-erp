import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Minus } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Input';
import { Pill } from '@/components/ui/Pill';
import { stocksApi } from '@/api/stocks.api';
import { toast } from '@/components/ui/Toast';
import { fmt } from '@/lib/utils';
import type { StockListItem } from '@/api/types';

interface UpdateStockModalProps {
  open: boolean;
  onClose: () => void;
  stock: StockListItem | null;
}

export function UpdateStockModal({ open, onClose, stock }: UpdateStockModalProps) {
  const qc = useQueryClient();
  const [newQty, setNewQty] = useState(0);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (stock) {
      setNewQty(stock.quantity);
      setNote('');
    }
  }, [stock]);

  const adjustMut = useMutation({
    mutationFn: stocksApi.adjust,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stocks'] });
      qc.invalidateQueries({ queryKey: ['stock-movements'] });
      toast.success('ปรับสต็อกเรียบร้อย');
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'ปรับสต็อกไม่สำเร็จ'),
  });

  if (!stock) return null;

  const diff = newQty - stock.quantity;
  const newStatus = newQty === 0 ? 'out' : newQty <= stock.reorderLevel ? 'low' : 'ok';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="ปรับสต็อกสินค้า"
      description={`${stock.productCode} · ${stock.productName}`}
      size="md"
      footer={
        <>
          <Button onClick={onClose}>ยกเลิก</Button>
          <Button
            variant="rust"
            disabled={adjustMut.isPending || diff === 0}
            onClick={() => adjustMut.mutate({
              productId: stock.productId,
              branchId: stock.branchId,
              newQuantity: newQty,
              note: note || null,
            })}
          >
            {adjustMut.isPending ? 'กำลังบันทึก...' : 'บันทึกการปรับสต็อก'}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Product info */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-paper-2 rounded-xl">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-mute mb-1">สาขา</div>
            <div className="font-medium text-sm">{stock.branchName}</div>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-mute mb-1">ราคาทุน</div>
            <div className="font-mono text-sm">฿{fmt.money(stock.cost)}</div>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-mute mb-1">จุดสั่งซื้อ</div>
            <div className="font-mono text-sm">{stock.reorderLevel} {stock.unit}</div>
          </div>
        </div>

        {/* Current vs New */}
        <div className="grid grid-cols-2 gap-6">
          <div className="text-center p-5 border border-rule rounded-xl">
            <div className="font-mono text-[10px] uppercase tracking-wider text-mute mb-2">จำนวนเดิม</div>
            <div className="editorial-num text-4xl text-mute">{stock.quantity}</div>
            <div className="mt-2">
              <Pill variant={stock.status === 'ok' ? 'success' : stock.status === 'low' ? 'warn' : 'danger'}>
                {stock.status === 'ok' ? 'พร้อมขาย' : stock.status === 'low' ? 'ใกล้หมด' : 'หมดสต็อก'}
              </Pill>
            </div>
          </div>
          <div className={`text-center p-5 border-2 rounded-xl ${diff > 0 ? 'border-green-500 bg-green-50/30' : diff < 0 ? 'border-rust bg-rust-glow/30' : 'border-rule'}`}>
            <div className="font-mono text-[10px] uppercase tracking-wider text-mute mb-2">จำนวนใหม่</div>
            <div className={`editorial-num text-4xl ${diff > 0 ? 'text-green-700' : diff < 0 ? 'text-rust' : 'text-ink'}`}>
              {newQty}
            </div>
            <div className="mt-2">
              <Pill variant={newStatus === 'ok' ? 'success' : newStatus === 'low' ? 'warn' : 'danger'}>
                {newStatus === 'ok' ? 'พร้อมขาย' : newStatus === 'low' ? 'ใกล้หมด' : 'หมดสต็อก'}
              </Pill>
            </div>
            {diff !== 0 && (
              <div className={`mt-2 font-mono text-xs font-bold ${diff > 0 ? 'text-green-700' : 'text-rust'}`}>
                {diff > 0 ? '+' : ''}{diff} {stock.unit}
              </div>
            )}
          </div>
        </div>

        {/* Stepper */}
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-mute mb-2">ปรับจำนวน</div>
          <div className="flex items-center gap-3">
            <Button onClick={() => setNewQty(Math.max(0, newQty - 10))} size="sm">−10</Button>
            <Button onClick={() => setNewQty(Math.max(0, newQty - 1))} size="sm">
              <Minus className="w-3 h-3" />
            </Button>
            <Input
              type="number"
              value={newQty}
              onChange={(e) => setNewQty(Math.max(0, parseInt(e.target.value || '0')))}
              className="text-center font-mono font-bold text-lg flex-1"
              min={0}
            />
            <Button onClick={() => setNewQty(newQty + 1)} size="sm">
              <Plus className="w-3 h-3" />
            </Button>
            <Button onClick={() => setNewQty(newQty + 10)} size="sm">+10</Button>
          </div>
        </div>

        {/* Note */}
        <Field label="หมายเหตุ (จะถูกบันทึกในประวัติ)">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="เช่น: นับสต็อกประจำสัปดาห์, รับคืนจากลูกค้า, ของชำรุด..."
            className="w-full px-3 py-2.5 border border-rule-strong rounded-lg bg-white text-sm focus:outline-none focus:border-ink focus:ring-2 focus:ring-ink/5"
            rows={2}
          />
        </Field>
      </div>
    </Modal>
  );
}
