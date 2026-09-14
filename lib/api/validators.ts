import {
  NAME_MIN_LENGTH,
  SERVICE_DURATION_MIN,
  SERVICE_DURATION_MAX,
  SERVICE_PRICE_MIN,
  SERVICE_PRICE_MAX,
} from "@/lib/constants";
import { isValidTimeHHMM, isValidPhone } from "@/lib/utils";
import type { BookingStatus } from "@/types";

/**
 * Валидаторы входных данных для API-роутов.
 *
 * Единый формат результата:
 *   { ok: true, data: T }  — всё прошло, вот нормализованные данные
 *   { ok: false, error }   — где-то не сходится, покажи сообщение
 *
 * Никаких zod/yup — простая ручная валидация с явными правилами.
 */

/* ─────────────────── Общий тип ─────────────────── */

export type Validated<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const fail = (error: string): Validated<never> => ({ ok: false, error });

/* ─────────────────── Мелкие проверки ─────────────────── */

function isPositiveInt(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n) && n > 0;
}

function isNonEmptyString(s: unknown, min = 1): s is string {
  return typeof s === "string" && s.trim().length >= min;
}

/* ─────────────────── Barber ─────────────────── */

export type BarberInput = {
  name: string;
  avatarUrl: string | null;
  active: boolean;
};

/**
 * Валидация барбера.
 * @param partial — для PATCH: не все поля обязательны
 */
export function validateBarberInput(
  body: unknown,
  { partial = false }: { partial?: boolean } = {},
): Validated<Partial<BarberInput>> {
  if (!body || typeof body !== "object") return fail("Пустое тело запроса");
  const b = body as Record<string, unknown>;

  const result: Partial<BarberInput> = {};

  if (b.name !== undefined || !partial) {
    if (!isNonEmptyString(b.name, NAME_MIN_LENGTH)) {
      return fail(`Имя должно быть не короче ${NAME_MIN_LENGTH} символов`);
    }
    result.name = (b.name as string).trim();
  }

  if (b.avatarUrl !== undefined) {
    if (b.avatarUrl === null || b.avatarUrl === "") {
      result.avatarUrl = null;
    } else if (typeof b.avatarUrl === "string") {
      result.avatarUrl = b.avatarUrl.trim() || null;
    } else {
      return fail("avatarUrl должен быть строкой или null");
    }
  }

  if (b.active !== undefined) {
    if (typeof b.active !== "boolean") {
      return fail("active должен быть boolean");
    }
    result.active = b.active;
  }

  if (partial && Object.keys(result).length === 0) {
    return fail("Нет полей для обновления");
  }

  return { ok: true, data: result };
}

/* ─────────────────── Service ─────────────────── */

export type ServiceInput = {
  name: string;
  durationMin: number;
  price: number;
  active: boolean;
};

export function validateServiceInput(
  body: unknown,
  { partial = false }: { partial?: boolean } = {},
): Validated<Partial<ServiceInput>> {
  if (!body || typeof body !== "object") return fail("Пустое тело запроса");
  const b = body as Record<string, unknown>;

  const result: Partial<ServiceInput> = {};

  if (b.name !== undefined || !partial) {
    if (!isNonEmptyString(b.name, NAME_MIN_LENGTH)) {
      return fail(`Название должно быть не короче ${NAME_MIN_LENGTH} символов`);
    }
    result.name = (b.name as string).trim();
  }

  if (b.durationMin !== undefined || !partial) {
    if (
      typeof b.durationMin !== "number" ||
      !Number.isFinite(b.durationMin) ||
      b.durationMin < SERVICE_DURATION_MIN ||
      b.durationMin > SERVICE_DURATION_MAX
    ) {
      return fail(
        `Длительность должна быть от ${SERVICE_DURATION_MIN} до ${SERVICE_DURATION_MAX} минут`,
      );
    }
    result.durationMin = Math.round(b.durationMin);
  }

  if (b.price !== undefined || !partial) {
    if (
      typeof b.price !== "number" ||
      !Number.isFinite(b.price) ||
      b.price < SERVICE_PRICE_MIN ||
      b.price > SERVICE_PRICE_MAX
    ) {
      return fail("Некорректная цена");
    }
    result.price = Math.round(b.price);
  }

  if (b.active !== undefined) {
    if (typeof b.active !== "boolean") {
      return fail("active должен быть boolean");
    }
    result.active = b.active;
  }

  if (partial && Object.keys(result).length === 0) {
    return fail("Нет полей для обновления");
  }

  return { ok: true, data: result };
}

/* ─────────────────── WorkSchedule ─────────────────── */

export type ScheduleInput = {
  barberId: number;
  weekday: number;
  startTime: string;
  endTime: string;
};

export function validateScheduleInput(
  body: unknown,
): Validated<ScheduleInput> {
  if (!body || typeof body !== "object") return fail("Пустое тело запроса");
  const b = body as Record<string, unknown>;

  if (!isPositiveInt(b.barberId)) return fail("Некорректный barberId");

  if (
    typeof b.weekday !== "number" ||
    !Number.isInteger(b.weekday) ||
    b.weekday < 0 ||
    b.weekday > 6
  ) {
    return fail("weekday должен быть 0..6");
  }

  if (!isValidTimeHHMM(b.startTime as string)) {
    return fail("startTime должен быть в формате HH:MM");
  }
  if (!isValidTimeHHMM(b.endTime as string)) {
    return fail("endTime должен быть в формате HH:MM");
  }
  if ((b.startTime as string) >= (b.endTime as string)) {
    return fail("startTime должен быть меньше endTime");
  }

  return {
    ok: true,
    data: {
      barberId: b.barberId,
      weekday: b.weekday,
      startTime: b.startTime as string,
      endTime: b.endTime as string,
    },
  };
}

/** Валидация частичного обновления расписания (PATCH). */
export type SchedulePatchInput = {
  weekday?: number;
  startTime?: string;
  endTime?: string;
};

export function validateSchedulePatch(
  body: unknown,
): Validated<SchedulePatchInput> {
  if (!body || typeof body !== "object") return fail("Пустое тело запроса");
  const b = body as Record<string, unknown>;

  const result: SchedulePatchInput = {};

  if (b.weekday !== undefined) {
    if (
      typeof b.weekday !== "number" ||
      !Number.isInteger(b.weekday) ||
      b.weekday < 0 ||
      b.weekday > 6
    ) {
      return fail("weekday должен быть 0..6");
    }
    result.weekday = b.weekday;
  }

  if (b.startTime !== undefined) {
    if (!isValidTimeHHMM(b.startTime as string)) {
      return fail("startTime должен быть в формате HH:MM");
    }
    result.startTime = b.startTime as string;
  }

  if (b.endTime !== undefined) {
    if (!isValidTimeHHMM(b.endTime as string)) {
      return fail("endTime должен быть в формате HH:MM");
    }
    result.endTime = b.endTime as string;
  }

  if (Object.keys(result).length === 0) {
    return fail("Нет полей для обновления");
  }

  return { ok: true, data: result };
}

/* ─────────────────── Booking ─────────────────── */

export type BookingInput = {
  serviceId: number;
  barberId: number | null;
  clientName: string;
  clientPhone: string;
  startsAt: string;
  source: "web" | "telegram";
  telegramId: string | null;
};

export function validateBookingInput(body: unknown): Validated<BookingInput> {
  if (!body || typeof body !== "object") return fail("Пустое тело запроса");
  const b = body as Record<string, unknown>;

  if (!isPositiveInt(b.serviceId)) return fail("Некорректный serviceId");

  let barberId: number | null = null;
  if (b.barberId !== undefined && b.barberId !== null) {
    if (!isPositiveInt(b.barberId)) return fail("Некорректный barberId");
    barberId = b.barberId;
  }

  if (!isNonEmptyString(b.clientName, NAME_MIN_LENGTH)) {
    return fail("Укажите имя (минимум 2 символа)");
  }

  if (typeof b.clientPhone !== "string" || !isValidPhone(b.clientPhone)) {
    return fail("Укажите корректный телефон");
  }

  if (typeof b.startsAt !== "string") {
    return fail("Некорректная дата начала");
  }
  const startsAtDate = new Date(b.startsAt);
  if (Number.isNaN(startsAtDate.getTime())) {
    return fail("Некорректная дата начала");
  }

  const source: "web" | "telegram" =
    b.source === "telegram" ? "telegram" : "web";

  const telegramId =
    typeof b.telegramId === "string" && b.telegramId.length > 0
      ? b.telegramId
      : null;

  return {
    ok: true,
    data: {
      serviceId: b.serviceId,
      barberId,
      clientName: (b.clientName as string).trim(),
      clientPhone: (b.clientPhone as string).trim(),
      startsAt: b.startsAt,
      source,
      telegramId,
    },
  };
}

/* ─────────────────── Booking status ─────────────────── */

export type BookingStatusInput = {
  status: BookingStatus;
};

export function validateBookingStatus(
  body: unknown,
): Validated<BookingStatusInput> {
  if (!body || typeof body !== "object") return fail("Пустое тело запроса");
  const b = body as Record<string, unknown>;

  if (b.status !== "confirmed" && b.status !== "cancelled") {
    return fail("status должен быть confirmed или cancelled");
  }

  return { ok: true, data: { status: b.status } };
}