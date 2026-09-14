import type { ReactNode } from "react";

export type Column<T> = {
  /** Уникальный ключ колонки. */
  key: string;
  /** Заголовок — текст или ReactNode. */
  header: ReactNode;
  /** Что рендерить в ячейке для конкретной строки. */
  render: (row: T) => ReactNode;
  /** Выравнивание содержимого. По умолчанию "left". */
  align?: "left" | "right" | "center";
  /** Ширина колонки (например "w-32" или "w-[120px]"). */
  width?: string;
  /** Скрыть колонку на маленьких экранах. */
  hideOnMobile?: boolean;
};

type TableProps<T> = {
  columns: Column<T>[];
  rows: T[];
  /** Как достать уникальный ключ строки. */
  rowKey: (row: T) => string | number;
  /** Что показать, если rows пуст. */
  empty?: ReactNode;
  /** Кол-во строк на страницу — пока не используется, задел на будущее. */
  className?: string;
};

const alignClass: Record<NonNullable<Column<unknown>["align"]>, string> = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
};

/**
 * Простая таблица без пагинации и сортировки.
 *
 * Пример:
 *   <Table
 *     columns={[
 *       { key: "name", header: "Имя", render: (b) => b.name },
 *       { key: "actions", header: "", align: "right", render: (b) => (
 *         <button onClick={() => remove(b.id)}>Удалить</button>
 *       )},
 *     ]}
 *     rows={barbers}
 *     rowKey={(b) => b.id}
 *     empty="Барберов пока нет"
 *   />
 */
export default function Table<T>({
  columns,
  rows,
  rowKey,
  empty = "Пусто",
  className,
}: TableProps<T>) {
  if (rows.length === 0) {
    return (
      <div className={["px-6 py-8 text-center text-barber-muted", className ?? ""].join(" ")}>
        {empty}
      </div>
    );
  }

  return (
    <div className={["overflow-x-auto", className ?? ""].join(" ")}>
      <table className="w-full text-sm">
        <thead className="border-b border-barber-border text-barber-muted">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={[
                  "px-5 py-3 font-medium whitespace-nowrap",
                  alignClass[col.align ?? "left"],
                  col.width ?? "",
                  col.hideOnMobile ? "hidden md:table-cell" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className="border-b border-barber-border last:border-0 transition-colors hover:bg-barber-surfaceHover"
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={[
                    "px-5 py-3 align-middle",
                    alignClass[col.align ?? "left"],
                    col.hideOnMobile ? "hidden md:table-cell" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}