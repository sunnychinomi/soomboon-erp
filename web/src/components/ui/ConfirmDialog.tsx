import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  title = 'ยืนยันการดำเนินการ',
  message,
  confirmText = 'ยืนยัน',
  cancelText = 'ยกเลิก',
  danger = false,
  onConfirm,
  onClose,
  loading,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button onClick={onClose} disabled={loading}>{cancelText}</Button>
          <Button
            variant={danger ? 'rust' : 'primary'}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'กำลังดำเนินการ...' : confirmText}
          </Button>
        </>
      }
    >
      <div className="flex gap-4 items-start">
        {danger && (
          <div className="w-10 h-10 rounded-full bg-burgundy-soft text-burgundy grid place-items-center flex-none">
            <AlertTriangle className="w-5 h-5" />
          </div>
        )}
        <p className="text-sm text-ink leading-relaxed pt-1">{message}</p>
      </div>
    </Modal>
  );
}
