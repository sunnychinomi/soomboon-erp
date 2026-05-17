import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Receipt, CreditCard, Wallet, Banknote, FileCheck } from 'lucide-react';
import { receiptsApi } from '@/api/receipts.api';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Field } from '@/components/ui/Input';
import { toast } from '@/components/ui/Toast';
import { fmt, cn } from '@/lib/utils';
import type { SalesOrderDetail, PaymentMethod } from '@/api/types';

interface Props {
  open: boolean;
  salesOrder: SalesOrderDetail;
  onClose: () => void;
}

const METHOD_CONFIG: Record<PaymentMethod, { label: string; Icon: any; color: string }> = {
  Cash:       { label: 'เงินสด',  Icon: Banknote,   color: 'green-700' },
  Transfer:   { label: 'โอน',     Icon: Wallet,     color: 'indigo' },
  Cheque:     { label: 'เช็ค',    Icon: FileCheck,  color: 'gold-dark' },
  CreditCard: { label: 'บัตรเครดิต', Icon: CreditCard, color: 'rust' },
};

export function ReceiveSalesPaymentModal({ open, salesOrder, onClose }: Props) {
  const qc = useQueryClient();
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState<PaymentMethod>('Cash');
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (open) {
      setAmount(salesOrder.balance);
      setMethod('Cash');
      setReference('');
      setNote('');
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [open, salesOrder]);

  const createMut = useMutation({
    mutationFn: receiptsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales-orders'] });
      qc.invalidateQueries({ queryKey: ['sales-order'] });
      qc.invalidateQueries({ queryKey: ['receipts'] });
      toast.success('บันทึกการรับชำระเรียบร้อย');
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'รับชำระไม่สำเร็จ'),
  });

  const handleSubmit = () => {
    if (amount <= 0) return toast.error('ยอดเงินต้องมากกว่า 0');
    if (amount > salesOrder.balance) return toast.error(`ยอดเกินค้างชำระ (เหลือ ฿${fmt.money(salesOrder.balance)})`);

    createMut.mutate({
      salesOrderId: salesOrder.id,
      receiptDate: date,
      amount,
      paymentMethod: method,
      paymentReference: reference || null,
      note: note || null,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="รับชำระเงิน"
      description={`${salesOrder.invoiceNo} · ${salesOrder.customerName}`}
      size="md"
      footer={
        <>
          <Button onClick={onClose}>ยกเลิก</Button>
          <Button variant="rust" onClick={handleSubmit} disabled={createMut.isPending || amount <= 0}>
            <Receipt className="w-3.5 h-3.5" />
            {createMut.isPending ? 'กำลังบันทึก...' : 'บันทึกใบเสร็จ'}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-paper-2 rounded-xl">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-mute mb-1">มูลค่ารวม</div>
            <div className="font-mono text-sm">฿{fmt.money(salesOrder.total)}</div>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-mute mb-1">รับแล้ว</div>
            <div className="font-mono text-sm text-green-700">฿{fmt.money(salesOrder.paidAmount)}</div>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-mute mb-1">คงเหลือ</div>
            <div className="font-mono text-lg font-bold text-rust">฿{fmt.money(salesOrder.balance)}</div>
          </div>
        </div>

        {/* Payment methods */}
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-mute mb-3">วิธีการชำระ</div>
          <div className="grid grid-cols-4 gap-2">
            {(Object.keys(METHOD_CONFIG) as PaymentMethod[]).map((m) => {
              const cfg = METHOD_CONFIG[m];
              const active = method === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={cn(
                    'flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all',
                    active
                      ? 'border-rust bg-rust/5'
                      : 'border-rule hover:border-rust/40',
                  )}
                >
                  <cfg.Icon className={cn('w-5 h-5', active ? 'text-rust' : 'text-mute')} />
                  <span className={cn('text-xs font-medium', active ? 'text-ink' : 'text-mute')}>{cfg.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Amount */}
        <Field label="ยอดเงิน (฿)">
          <Input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(Math.max(0, parseFloat(e.target.value || '0')))}
            className="text-xl font-bold font-mono text-right"
            min={0}
            max={salesOrder.balance}
          />
          <div className="flex gap-2 mt-2">
            <Button size="sm" type="button" onClick={() => setAmount(salesOrder.balance)}>
              ชำระเต็มจำนวน
            </Button>
            <Button size="sm" type="button" onClick={() => setAmount(Math.round(salesOrder.balance / 2))}>
              ครึ่งหนึ่ง
            </Button>
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="วันที่รับเงิน"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <Field label="เลขที่อ้างอิง">
            <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="เลขที่เช็ค, slip โอน..." />
          </Field>
        </div>

        <Field label="หมายเหตุ">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="w-full px-3 py-2.5 border border-rule-strong rounded-lg bg-white text-sm focus:outline-none focus:border-ink"
            placeholder="หมายเหตุเพิ่มเติม..."
          />
        </Field>
      </div>
    </Modal>
  );
}
