/**
 * Все операции с датами в одном месте.
 * Единый источник правды: работаем с локальным временем сервера,
 * а не с UTC — чтобы сетка слотов совпадала с тем, что видит пользователь.
 */

/** "YYYY-MM-DD" для локальной даты. */
export function toDateISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Сегодняшняя дата в формате "YYYY-MM-DD". */
export function todayISO(): string {
  return toDateISO(new Date());
}

/** Прибавить дни к "YYYY-MM-DD", вернуть "YYYY-MM-DD". */
export function addDaysISO(dateISO: string, days: number): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return toDateISO(dt);
}

/** Проверка формата "YYYY-MM-DD". */
export function isValidDateISO(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

/** День недели: 0 = Sunday, 1 = Monday, … 6 = Saturday. */
export function weekdayOf(dateISO: string): number {
  const [y, m, d] = dateISO.split("-").map(Number);
  return new Date(y, m - 1, d).getDay();
}

/** Разбор "YYYY-MM-DD" в локальную полночь. */
export function parseDateISO(dateISO: string): Date {
  const [y, m, d] = dateISO.split("-").map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

/** Локальная Date из "YYYY-MM-DD" + минуты от начала суток. */
export function dateWithMinutes(dateISO: string, minutes: number): Date {
  const date = parseDateISO(dateISO);
  date.setMinutes(minutes);
  return date;
}

/** Начало и конец суток в локальном времени (end — эксклюзивный). */
export function dayBounds(dateISO: string): { start: Date; end: Date } {
  const start = parseDateISO(dateISO);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

/* ───────────────────── Форматирование для UI ───────────────────── */

/** "15 января, ср". */
export function humanDate(dateISO: string): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    weekday: "short",
  });
}

/** "15 января, 14:30". */
export function humanDateTime(iso: string): string {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "14:30". */
export function humanTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ───────────────────── Работа со временем "HH:MM" ───────────────────── */

/** "10:00" → 600 (минут от начала суток). */
export function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/** 600 → "10:00". */
export function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Валидация "HH:MM" от 00:00 до 23:59. */
export function isValidTimeHHMM(t: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(t);
}