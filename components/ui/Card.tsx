import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
  /** Убрать внутренние отступы — для таблиц и карточек с разделителями. */
  flush?: boolean;
  /** Заголовок секции. Отрисуется с бордером снизу. */
  title?: ReactNode;
  /** Действия в правом верхнем углу (кнопки, фильтры). */
  actions?: ReactNode;
};

/**
 * Базовая карточка в стилистике барбершопа: тёмный фон, тонкая обводка.
 *
 * Примеры:
 *   <Card>Просто блок</Card>
 *   <Card title="Барберы" actions={<Button size="sm">Добавить</Button>}>...</Card>
 *   <Card flush><Table>...</Table></Card>
 */
export default function Card({
  children,
  className,
  flush = false,
  title,
  actions,
}: CardProps) {
  return (
    <div
      className={[
        "rounded-card border border-barber-border bg-barber-surface",
        flush ? "" : "p-6",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {(title || actions) && (
        <div
          className={[
            "flex items-center justify-between gap-4",
            flush ? "border-b border-barber-border px-6 py-4" : "mb-4",
          ].join(" ")}
        >
          {title && <h2 className="text-lg font-semibold">{title}</h2>}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}