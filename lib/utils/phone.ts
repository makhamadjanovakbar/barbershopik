import { PHONE_MIN_DIGITS } from "@/lib/constants";

/**
 * Всё, что связано с телефоном: нормализация и валидация.
 * Заточено под Узбекистан (+998), но не ломается на других форматах.
 */

/** Оставить только цифры. */
export function phoneDigits(raw: string): string {
  return raw.replace(/\D/g, "");
}

/** Проверка: минимум PHONE_MIN_DIGITS цифр. */
export function isValidPhone(raw: string): boolean {
  return phoneDigits(raw).length >= PHONE_MIN_DIGITS;
}

/**
 * Нормализация к формату 998XXXXXXXXX (12 цифр).
 *
 * Примеры:
 *   "+998 90 123 45 67"     → "998901234567"
 *   "998 90 123 45 67"      → "998901234567"
 *   "90 123 45 67"          → "998901234567"
 *   "8 90 123 45 67"        → "998901234567"  (на случай опечатки)
 *   "+1 234 567 8901"       → "12345678901"   (не наш формат — как есть)
 */
export function normalizePhone(raw: string): string {
  let d = phoneDigits(raw);

  // 9 цифр → добавить код 998
  if (d.length === 9) {
    d = "998" + d;
  }
  // 10 цифр, начинается с 8 → заменить на 998 (опечатка, что набрали российский формат)
  else if (d.length === 10 && d.startsWith("8")) {
    d = "998" + d.slice(1);
  }
  // 12 цифр, начинается с 998 → оставить
  // 13 цифр, начинается с 8 998 → срезать 8
  else if (d.length === 13 && d.startsWith("8998")) {
    d = d.slice(1);
  }

  return d;
}