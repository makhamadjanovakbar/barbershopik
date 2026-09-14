import { cookies } from "next/headers";
import crypto from "node:crypto";
import { ADMIN_COOKIE, ADMIN_SESSION_TTL_SEC } from "@/lib/constants";

/**
 * Простая авторизация админки.
 *
 * Схема:
 *  - пароль хранится в ADMIN_PASSWORD (env);
 *  - успешный логин выдаёт httpOnly-cookie с токеном вида nonce.exp.sig;
 *  - sig = HMAC-SHA256(nonce.exp, ADMIN_PASSWORD);
 *  - при каждом запросе проверяем подпись и срок.
 *
 * Никаких JWT-библиотек, никаких сессионных таблиц.
 * Секрет — сам пароль админа, отдельный SESSION_SECRET не нужен.
 */

function getPassword(): string {
  const pwd = process.env.ADMIN_PASSWORD;
  if (!pwd) {
    throw new Error("ADMIN_PASSWORD не задан в .env");
  }
  return pwd;
}

function sign(value: string): string {
  return crypto.createHmac("sha256", getPassword()).update(value).digest("hex");
}

function createToken(): string {
  const nonce = crypto.randomBytes(16).toString("hex");
  const exp = Date.now() + ADMIN_SESSION_TTL_SEC * 1000;
  const payload = `${nonce}.${exp}`;
  return `${payload}.${sign(payload)}`;
}

function verifyToken(token: string | undefined): boolean {
  if (!token) return false;

  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const [nonce, expStr, sig] = parts;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;

  const expected = sign(`${nonce}.${expStr}`);

  // timing-safe сравнение
  const a = Buffer.from(sig, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/* ─────────────────── Публичный API ─────────────────── */

/** Проверить пароль администратора (timing-safe). */
export function checkAdminPassword(input: string): boolean {
  const expected = getPassword();
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/** Установить сессионную cookie админа. */
export async function setAdminSession(): Promise<void> {
  const store = await cookies();
  store.set(ADMIN_COOKIE, createToken(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_TTL_SEC,
    secure: process.env.NODE_ENV === "production",
  });
}

/** Удалить сессию админа. */
export async function clearAdminSession(): Promise<void> {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
}

/** Проверить, залогинен ли админ. */
export async function isAdminAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return verifyToken(store.get(ADMIN_COOKIE)?.value);
}

/**
 * Хелпер для API-роутов: возвращает Response 401 или null, если всё ок.
 *
 * Использование:
 *   const guard = await requireAdmin();
 *   if (guard) return guard;
 *   // …основная логика
 */
export async function requireAdmin(): Promise<Response | null> {
  const ok = await isAdminAuthenticated();
  if (ok) return null;
  return Response.json(
    { error: "Не авторизован", code: "UNAUTHORIZED" },
    { status: 401 },
  );
}