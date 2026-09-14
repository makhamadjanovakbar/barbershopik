import { NextResponse } from "next/server";
import { appError, httpStatusForCode, type AppErrorCode } from "@/lib/errors";

/**
 * Хелперы для API-роутов: единый формат ответов и ошибок.
 * Убирают разбросанные по файлам `NextResponse.json(...)` с
 * ручными статусами и структурой `{ error: "..." }`.
 */

/** Успешный JSON-ответ. */
export function jsonOk<T>(data: T, status = 200): NextResponse<T> {
  return NextResponse.json(data, { status });
}

/** Ответ с ошибкой и правильным HTTP-статусом по коду. */
export function jsonError(
  message: string,
  code?: AppErrorCode,
): NextResponse {
  return NextResponse.json(appError(message, code), {
    status: httpStatusForCode(code),
  });
}

/** Короткие хелперы под частые коды. */
export const jsonBadRequest = (message = "Некорректные данные") =>
  jsonError(message, "INVALID_INPUT");

export const jsonUnauthorized = (message = "Не авторизован") =>
  jsonError(message, "UNAUTHORIZED");

export const jsonNotFound = (message = "Не найдено") =>
  jsonError(message, "NOT_FOUND");

export const jsonConflict = (message = "Конфликт") =>
  jsonError(message, "CONFLICT");

export const jsonInternal = (message = "Внутренняя ошибка") =>
  jsonError(message, "INTERNAL");

/**
 * Безопасный разбор JSON из запроса.
 * Возвращает либо объект, либо null (без throw).
 */
export async function parseJson<T = unknown>(
  req: Request,
): Promise<T | null> {
  try {
    const data = await req.json();
    if (data === null || typeof data !== "object") return null;
    return data as T;
  } catch {
    return null;
  }
}