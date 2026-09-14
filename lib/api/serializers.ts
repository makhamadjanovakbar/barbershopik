import type {
  BookingWithDetails,
  BookingDTO,
  BookingSource,
  BookingStatus,
} from "@/types";

/**
 * Сериализаторы Prisma-записей в DTO для клиента.
 *
 * Зачем отдельный слой:
 *   - Prisma возвращает Date-объекты, а в JSON они должны быть ISO-строками;
 *   - поля status/source — строки в БД, но на фронте мы хотим узкие типы
 *     BookingStatus и BookingSource;
 *   - одна точка изменения формата ответа — если что-то поменяется,
 *     правим только здесь, а не в 5 API-роутах.
 */

type PrismaBooking = {
  id: number;
  barberId: number;
  serviceId: number;
  clientName: string;
  clientPhone: string;
  telegramId: string | null;
  startsAt: Date;
  endsAt: Date;
  status: string;
  source: string;
  createdAt: Date;
};

type PrismaBookingWithRelations = PrismaBooking & {
  barber: { id: number; name: string };
  service: {
    id: number;
    name: string;
    price: number;
    durationMin: number;
  };
};

function normalizeStatus(s: string): BookingStatus {
  return s === "cancelled" ? "cancelled" : "confirmed";
}

function normalizeSource(s: string): BookingSource {
  return s === "telegram" ? "telegram" : "web";
}

/* ─────────────────── Базовый Booking ─────────────────── */

/** Простой DTO — что отдаём клиенту после создания записи. */
export function serializeBooking(b: PrismaBooking): BookingDTO {
  return {
    id: b.id,
    barberId: b.barberId,
    serviceId: b.serviceId,
    clientName: b.clientName,
    clientPhone: b.clientPhone,
    telegramId: b.telegramId,
    startsAt: b.startsAt.toISOString(),
    endsAt: b.endsAt.toISOString(),
    status: normalizeStatus(b.status),
    source: normalizeSource(b.source),
    createdAt: b.createdAt.toISOString(),
  };
}

/* ─────────────────── Расширенный Booking ─────────────────── */

/** С джойнами — для админской таблицы и «моих записей» в боте. */
export function serializeBookingDetailed(
  b: PrismaBookingWithRelations,
): BookingWithDetails {
  return {
    ...serializeBooking(b),
    barberName: b.barber.name,
    serviceName: b.service.name,
    servicePrice: b.service.price,
    serviceDurationMin: b.service.durationMin,
  };
}

/* ─────────────────── Barber / Service ─────────────────── */

type PrismaBarber = {
  id: number;
  name: string;
  avatarUrl: string | null;
  active: boolean;
};

type PrismaService = {
  id: number;
  name: string;
  durationMin: number;
  price: number;
  active: boolean;
};

export function serializeBarber(b: PrismaBarber) {
  return {
    id: b.id,
    name: b.name,
    avatarUrl: b.avatarUrl,
    active: b.active,
  };
}

export function serializeService(s: PrismaService) {
  return {
    id: s.id,
    name: s.name,
    durationMin: s.durationMin,
    price: s.price,
    active: s.active,
  };
}

/* ─────────────────── WorkSchedule ─────────────────── */

type PrismaWorkSchedule = {
  id: number;
  barberId: number;
  weekday: number;
  startTime: string;
  endTime: string;
};

export function serializeSchedule(s: PrismaWorkSchedule) {
  return {
    id: s.id,
    barberId: s.barberId,
    weekday: s.weekday,
    startTime: s.startTime,
    endTime: s.endTime,
  };
}