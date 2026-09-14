import { Card, Table, type Column } from "@/components/ui";
import type { ReactNode } from "react";

type DataTableProps<T> = {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  loading?: boolean;
  error?: string | null;
  /** Что показать, если строк нет. */
  empty?: ReactNode;
};

/**
 * Таблица для админских страниц с состояниями loading / error / empty.
 * Оборачивает ui/Table в Card flush — получается цельная «плитка».
 *
 * Пример:
 *   <DataTable
 *     columns={columns}
 *     rows={barbers}
 *     rowKey={(b) => b.id}
 *     loading={loading}
 *     error={error}
 *     empty="Барберов пока нет"
 *   />
 */
export default function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading,
  error,
  empty = "Пусто",
}: DataTableProps<T>) {
  if (loading) {
    return (
      <Card flush>
        <div className="px-6 py-12 text-center text-barber-muted">
          Загружаем…
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card flush>
        <div className="px-6 py-12 text-center text-sm text-barber-danger">
          {error}
        </div>
      </Card>
    );
  }

  return (
    <Card flush>
      <Table
        columns={columns}
        rows={rows}
        rowKey={rowKey}
        empty={empty}
      />
    </Card>
  );
}