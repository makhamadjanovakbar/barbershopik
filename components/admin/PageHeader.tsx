import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description?: string;
  /** Кнопки/фильтры справа. */
  actions?: ReactNode;
};

/**
 * Шапка страницы админки: заголовок, описание и действия справа.
 *
 * Пример:
 *   <PageHeader
 *     title="Барберы"
 *     description="Добавляй, редактируй и скрывай сотрудников"
 *     actions={<Button size="sm">Обновить</Button>}
 *   />
 */
export default function PageHeader({
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-barber-muted">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}