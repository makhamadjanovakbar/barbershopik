import type { BookingSource, BookingStatus, Slot } from "./models";

/**
 * DTO — формы запросов и ответов API.
 * Здесь только то, что реально уходит по сети, плюс коды ошибок.
 */

/* ─────────────────────────── Ошибки ─────────────────────────── */

export type ApiErrorCode =
  | "INVALID_INPUT"
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "SLOT_TAKEN"
  | "SLOT_UNAVAILABLE"
  | "SERVICE_NOT_FOUND"
  | "BARBER_NOT_FOUND"
  | "CONFLICT"
  | "INTERNAL";

export type ApiError = {
  error: string;
  code?: ApiErrorCode;
};

/* ─────────────────────────── Записи ─────────────────────────── */

/** Что отдаём клиенту после создания/получения записи. */
export type BookingDTO = {
  id: number;
  barberId: number;
  serviceId: number;
  clientName: string;
  clientPhone: string;
  telegramId: string | null;
  startsAt: string;
  endsAt: string;
  status: BookingStatus;
  source: BookingSource;
  createdAt: string;
};

/** Расширенная версия для админки — с именами барбера и услуги. */
export type BookingWithDetails = BookingDTO & {
  barberName: string;
  serviceName: string;
  servicePrice: number;
  serviceDurationMin: number;
};

/* ─────────────────────────── Запросы ─────────────────────────── */

export type CreateBookingPayload = {
  serviceId: number;
  /** отсутствует → "любой свободный" */
  barberId?: number | null;
  clientName: string;
  clientPhone: string;
  /** ISO datetime */
  startsAt: string;
  source?: BookingSource;
  telegramId?: string | null;
};

export type LoginPayload = {
  password: string;
};

export type UpdateStatusPayload = {
  status: BookingStatus;
};

/* ─────────────────────────── Ответы ─────────────────────────── */

export type AvailabilityResponse = {
  date: string;
  barberId: number | null;
  serviceId: number;
  slots: Slot[];
};

export type WorkloadBookingItem = {
  id: number;
  startsAt: string;
  endsAt: string;
  serviceName: string;
  clientName: string;
  clientPhone: string;
  status: BookingStatus;
};

export type BarberWorkload = {
  barberId: number;
  barberName: string;
  totalMinutes: number;
  bookedMinutes: number;
  /** 0..100 */
  occupancy: number;
  bookings: WorkloadBookingItem[];
};

export type WorkloadResponse = {
  date: string;
  barbers: BarberWorkload[];
};