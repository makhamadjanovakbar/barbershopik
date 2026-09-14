/**
 * Единые константы проекта.
 */

/* ─────────────────── Слоты ─────────────────── */

export const SLOT_STEP_MIN = 30;
export const MIN_LEAD_MINUTES_WEB = 15;
export const MIN_LEAD_MINUTES_BOT = 60;

/* ─────────────────── Валидация ─────────────────── */

export const SERVICE_DURATION_MIN = 5;
export const SERVICE_DURATION_MAX = 600;

/** Мин. и макс. цена услуги (в сумах). 10 000 000 — с запасом на премиум-услуги. */
export const SERVICE_PRICE_MIN = 0;
export const SERVICE_PRICE_MAX = 10_000_000;

/** Валюта отображения. Одна строка — меняется в одном месте. */
export const CURRENCY = "сум";

/** Минимальная длина имени. */
export const NAME_MIN_LENGTH = 2;

/** Минимальное количество цифр в номере телефона (Узбекистан: 9 после кода страны). */
export const PHONE_MIN_DIGITS = 9;

/* ─────────────────── Auth ─────────────────── */

export const ADMIN_COOKIE = "admin_session";
export const ADMIN_SESSION_TTL_SEC = 60 * 60 * 12;

/* ─────────────────── Лимиты ─────────────────── */

export const BOOKINGS_LOOKBACK_DAYS = 30;
export const BOT_DAYS_AHEAD = 14;
export const BOT_SLOTS_PER_ROW = 4;

/* ─────────────────── Справочники ─────────────────── */

export const WEEKDAYS_RU = [
  { value: 1, label: "Понедельник" },
  { value: 2, label: "Вторник" },
  { value: 3, label: "Среда" },
  { value: 4, label: "Четверг" },
  { value: 5, label: "Пятница" },
  { value: 6, label: "Суббота" },
  { value: 0, label: "Воскресенье" },
] as const;

export const WEEKDAYS_SHORT_RU = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"] as const;

export const MONTHS_RU = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
] as const;