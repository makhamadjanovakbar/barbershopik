/**
 * Доменные модели — то, что лежит в БД и что мы отдаём наружу в чистом виде.
 * Здесь только структуры, никаких функций.
 */

export type Service = {
  id: number;
  name: string;
  durationMin: number;
  price: number;
  active: boolean;
};

export type Barber = {
  id: number;
  name: string;
  avatarUrl: string | null;
  active: boolean;
};

export type WorkSchedule = {
  id: number;
  barberId: number;
  /** 0 = Sunday, 1 = Monday, …, 6 = Saturday */
  weekday: number;
  /** "HH:MM" */
  startTime: string;
  /** "HH:MM" */
  endTime: string;
};

export type ScheduleException = {
  id: number;
  barberId: number;
  /** "YYYY-MM-DD" */
  date: string;
  startTime: string | null;
  endTime: string | null;
  isDayOff: boolean;
};

export type BookingStatus = "confirmed" | "cancelled";
export type BookingSource = "web" | "telegram";

export type Booking = {
  id: number;
  barberId: number;
  serviceId: number;
  clientName: string;
  clientPhone: string;
  telegramId: string | null;
  /** ISO datetime */
  startsAt: string;
  /** ISO datetime */
  endsAt: string;
  status: BookingStatus;
  source: BookingSource;
  /** ISO datetime */
  createdAt: string;
};

/** Слот, который предлагаем клиенту на выбор. */
export type Slot = {
  /** "HH:MM" — для отображения */
  time: string;
  /** ISO — для передачи в API */
  startsAt: string;
  /** ISO */
  endsAt: string;
};