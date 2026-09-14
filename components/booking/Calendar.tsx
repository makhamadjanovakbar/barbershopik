"use client";

import { useMemo, useState } from "react";
import { MONTHS_RU, WEEKDAYS_SHORT_RU } from "@/lib/constants";
import { toDateISO, todayISO } from "@/lib/utils/date";

type CalendarProps = {
  /** Выбранная дата в формате "YYYY-MM-DD". */
  selectedDate: string | null;
  /** Колбэк при выборе даты. */
  onSelect: (date: string) => void;
  /** Множество доступных дат. Если не передано — все будущие дни активны. */
  availableDates?: Set<string>;
  /** Отключить прошедшие даты. По умолчанию true. */
  disablePast?: boolean;
};

/**
 * Интерактивный календарь на месяц.
 * Понедельник — первый день недели. Прошедшие дни недоступны.
 */
export default function Calendar({
  selectedDate,
  onSelect,
  availableDates,
  disablePast = true,
}: CalendarProps) {
  const today = useMemo(() => todayISO(), []);
  const [viewMonth, setViewMonth] = useState<{ year: number; month: number }>(
    () => {
      if (selectedDate) {
        const [y, m] = selectedDate.split("-").map(Number);
        return { year: y, month: m - 1 };
      }
      const [y, m] = today.split("-").map(Number);
      return { year: y, month: m - 1 };
    },
  );

  const { year, month } = viewMonth;

  const cells = useMemo(() => {
    const first = new Date(year, month, 1);
    // 0 = Monday … 6 = Sunday
    const firstWeekday = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const result: (string | null)[] = [];
    for (let i = 0; i < firstWeekday; i++) result.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = toDateISO(new Date(year, month, d));
      result.push(iso);
    }
    return result;
  }, [year, month]);

  const prevMonth = () =>
    setViewMonth((v) =>
      v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 },
    );

  const nextMonth = () =>
    setViewMonth((v) =>
      v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 },
    );

  const isAvailable = (iso: string): boolean => {
    if (disablePast && iso < today) return false;
    if (availableDates && availableDates.size > 0) {
      return availableDates.has(iso);
    }
    return true;
  };

  return (
    <div className="w-full select-none">
      {/* Заголовок с навигацией */}
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={prevMonth}
          className="rounded-md border border-barber-border px-3 py-2 text-sm text-barber-muted transition-colors hover:border-barber-accent hover:text-barber-accent"
          aria-label="Предыдущий месяц"
        >
          ←
        </button>
        <div className="text-lg font-semibold">
          {MONTHS_RU[month]} {year}
        </div>
        <button
          type="button"
          onClick={nextMonth}
          className="rounded-md border border-barber-border px-3 py-2 text-sm text-barber-muted transition-colors hover:border-barber-accent hover:text-barber-accent"
          aria-label="Следующий месяц"
        >
          →
        </button>
      </div>

      {/* Дни недели */}
      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs uppercase tracking-wider text-barber-muted">
        {WEEKDAYS_SHORT_RU.map((w) => (
          <div key={w} className="py-1">
            {w}
          </div>
        ))}
      </div>

      {/* Сетка дат */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((iso, idx) => {
          if (!iso) return <div key={`empty-${idx}`} />;

          const day = Number(iso.slice(8, 10));
          const selected = selectedDate === iso;
          const available = isAvailable(iso);
          const isToday = today === iso;

          return (
            <button
              key={iso}
              type="button"
              disabled={!available}
              onClick={() => onSelect(iso)}
              className={[
                "flex aspect-square items-center justify-center rounded-md border text-sm transition-colors",
                selected
                  ? "border-barber-accent bg-barber-accent font-semibold text-barber-bg"
                  : available
                    ? "border-barber-border text-barber-text hover:border-barber-accent hover:text-barber-accent"
                    : "cursor-not-allowed border-transparent text-barber-muted/40",
                isToday && !selected ? "ring-1 ring-barber-accent/40" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}