import type { Context, SessionFlavor } from "grammy";
import type { Slot } from "@/types";

/**
 * Состояние диалога записи.
 *
 * Сессия хранится в памяти бота (grammy session).
 * Для первой версии этого достаточно; в проде стоит заменить на Redis-адаптер.
 */
export type BookingDraft = {
  step:
    | "idle"
    | "choosing_service"
    | "choosing_barber"
    | "choosing_date"
    | "choosing_time"
    | "entering_name"
    | "entering_phone";

  serviceId?: number;
  serviceName?: string;

  /** number — конкретный барбер, "any" — «любой свободный». */
  barberId?: number | "any";
  barberName?: string;

  /** "YYYY-MM-DD" */
  date?: string;

  /** Закешированные слоты для выбранной даты. */
  slots?: Slot[];

  /** ISO datetime выбранного слота. */
  slotStartsAt?: string;

  /** Черновик контактов. */
  clientName?: string;
};

/** Начальное состояние — пустая сессия. */
export function initialSession(): BookingDraft {
  return { step: "idle" };
}

/** Итоговый тип контекста, который используется во всех хендлерах. */
export type BotContext = Context & SessionFlavor<BookingDraft>;