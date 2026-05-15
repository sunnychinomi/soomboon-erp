import type { ReactNode } from 'react';
import { Button } from './Button';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: ReactNode;
  align?: 'left' | 'right' | 'center';
  width?: string;
  render: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  emptyMessage?: string;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
  };
}

export function DataTable<T extends { id: string | number }>({
  columns,
  rows,
  loading,
  emptyMessage = 'ไม่พบข้อมูล',
  pagination,
}: DataTableProps<T>) {
  return (
    <div className="bg-white border border-rule rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-paper">
            <tr>
              {columns.map((c) => (
                <th key={c.key}
                  style={{ width: c.width, textAlign: c.align }}
                  className="text-left font-mono text-[10px] tracking-[0.14em] uppercase text-mute px-4 py-3.5 border-b border-rule font-semibold whitespace-nowrap"
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={columns.length} className="text-center py-16 text-mute">กำลังโหลด...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={columns.length} className="text-center py-16 text-mute">
                <Search className="w-10 h-10 mx-auto mb-3 opacity-40" />
                {emptyMessage}
              </td></tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-paper border-b border-rule last:border-0 transition-colors">
                  {columns.map((c) => (
                    <td key={c.key}
                      style={{ textAlign: c.align }}
                      className={`px-4 py-3.5 text-[13px] ${c.className || ''}`}
                    >
                      {c.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.total > 0 && (
        <div className="flex justify-between items-center px-5 py-3.5 border-t border-rule bg-paper text-xs text-mute font-mono tracking-wider">
          <span>
            แสดง {(pagination.page - 1) * pagination.pageSize + 1}–
            {Math.min(pagination.page * pagination.pageSize, pagination.total)} จาก {pagination.total} รายการ
          </span>
          <div className="flex gap-1.5 items-center">
            <Button
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              <ChevronLeft className="w-3 h-3" />
            </Button>
            <span className="px-3 py-1 bg-ink text-white rounded-md text-xs">
              {pagination.page} / {Math.max(1, Math.ceil(pagination.total / pagination.pageSize))}
            </span>
            <Button
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
            >
              <ChevronRight className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
