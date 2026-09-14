import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { serializeBooking } from "@/lib/api/serializers";
import { normalizePhone } from "@/lib/utils";
import {
  computeSlotsForAnyBarber,
  computeSlotsForBarber,
} from "./slots";
import type { BookingDTO, BookingSource } from "@/types";
import type { BookingErrorCode } from "@/lib/errors";

/**
 * Создание записи — единая точка для сайта и бота.
 *
 * Защита от двойной записи двухуровневая:
 *   1. Логическая — пересчитываем слоты перед созданием и убеждаемся,
 *      что выбранное время входит в список свободных.
 *   2. На уровне БД — уникальный индекс (barberId, startsAt). Даже если
 *      два запроса одновременно прошли шаг 1, второй поймает P2002.
 */

export type CreateBookingInput = {
  serviceId: number;
  /** null или undefined → «любой свободный». */
  barberId?: number | null;
  clientName: string;
  clientPhone: string;
  /** ISO datetime. */
  startsAt: string;
  source?: BookingSource;
  telegramId?: string | null;
};

export type CreateBookingResult =
  | { ok: true; booking: BookingDTO }
  | { ok: false; error: string; code: BookingErrorCode };

export async function createBooking(
  input: CreateBookingInput,
): Promise<CreateBookingResult> {
  const clientName = input.clientName?.trim() ?? "";
  const clientPhoneRaw = input.clientPhone?.trim() ?? "";
  const source: BookingSource = input.source === "telegram" ? "telegram" : "web";

  /* ─────────────── 1. Базовые проверки ─────────────── */

  if (clientName.length < 2) {
    return { ok: false, error: "Имя слишком короткое", code: "INVALID_INPUT" };
  }
  if (clientPhoneRaw.replace(/\D/g, "").length < 10) {
    return { ok: false, error: "Некорректный телефон", code: "INVALID_INPUT" };
  }
  if (!input.serviceId || !input.startsAt) {
    return { ok: false, error: "Не хватает данных", code: "INVALID_INPUT" };
  }

  const startsAt = new Date(input.startsAt);
  if (Number.isNaN(startsAt.getTime())) {
    return { ok: false, error: "Некорректная дата", code: "INVALID_INPUT" };
  }
  if (startsAt.getTime() < Date.now() - 60_000) {
    return { ok: false, error: "Нельзя записаться в прошлое", code: "INVALID_INPUT" };
  }

  /* ─────────────── 2. Проверка услуги ─────────────── */

  const service = await prisma.service.findUnique({
    where: { id: input.serviceId },
  });
  if (!service || !service.active) {
    return { ok: false, error: "Услуга недоступна", code: "SERVICE_NOT_FOUND" };
  }

  /* ─────────────── 3. Определение барбера ─────────────── */

  const dateISO = toDateISO(startsAt);
  let barberId: number | null = input.barberId ?? null;

  if (barberId !== null) {
    // Конкретный барбер
    const barber = await prisma.barber.findUnique({ where: { id: barberId } });
    if (!barber || !barber.active) {
      return { ok: false, error: "Барбер недоступен", code: "BARBER_NOT_FOUND" };
    }

    const slots = await computeSlotsForBarber({
      barberId,
      serviceId: service.id,
      dateISO,
    });
    const match = slots.find(
      (s) => new Date(s.startsAt).getTime() === startsAt.getTime(),
    );
    if (!match) {
      return { ok: false, error: "Это время занято", code: "SLOT_UNAVAILABLE" };
    }
  } else {
    // «Любой свободный» — ищем барбера, у которого этот слот свободен
    const anySlots = await computeSlotsForAnyBarber({
      serviceId: service.id,
      dateISO,
    });
    const match = anySlots.find(
      (s) => new Date(s.slot.startsAt).getTime() === startsAt.getTime(),
    );
    if (!match) {
      return { ok: false, error: "Это время занято", code: "SLOT_UNAVAILABLE" };
    }
    barberId = match.barberId;
  }

  /* ─────────────── 4. Создание записи ─────────────── */

  const endsAt = new Date(startsAt.getTime() + service.durationMin * 60_000);
  const clientPhone = normalizePhone(clientPhoneRaw);

  try {
    const created = await prisma.booking.create({
      data: {
        barberId: barberId!,
        serviceId: service.id,
        clientName,
        clientPhone,
        telegramId: input.telegramId ?? null,
        startsAt,
        endsAt,
        status: "confirmed",
        source,
      },
    });

    return { ok: true, booking: serializeBooking(created) };
  } catch (e) {
    // P2002 — нарушение уникальности (barberId, startsAt) → гонка
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return { ok: false, error: "Это время уже занято", code: "SLOT_TAKEN" };
    }
    console.error("createBooking error:", e);
    return { ok: false, error: "Внутренняя ошибка", code: "INTERNAL" };
  }
}

/* ─────────────── Отмена и обновление ─────────────── */

/** Отменить запись (клиент или админ). */
export async function cancelBooking(id: number): Promise<BookingDTO | null> {
  const updated = await prisma.booking
    .update({
      where: { id },
      data: { status: "cancelled" },
    })
    .catch(() => null);

  return updated ? serializeBooking(updated) : null;
}

/** Получить запись по id. */
export async function getBooking(id: number): Promise<BookingDTO | null> {
  const booking = await prisma.booking.findUnique({ where: { id } });
  return booking ? serializeBooking(booking) : null;
}

/** Список активных записей клиента по Telegram ID. */
export async function listBookingsByTelegramId(
  telegramId: string,
): Promise<BookingDTO[]> {
  const rows = await prisma.booking.findMany({
    where: { telegramId, status: "confirmed" },
    orderBy: { startsAt: "asc" },
  });
  return rows.map(serializeBooking);
}

/* ─────────────── Внутренние хелперы ─────────────── */

function toDateISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}