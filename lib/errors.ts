/**
 * Коды ошибок и утилиты для их сериализации.
 * Используются в booking-логике и API-роутах.
 */

/** Коды бизнес-ошибок, которые возвращает booking-слой. */
export type BookingErrorCode =
  | "INVALID_INPUT"
  | "SERVICE_NOT_FOUND"
  | "BARBER_NOT_FOUND"
  | "SLOT_UNAVAILABLE"
  | "SLOT_TAKEN"
  | "INTERNAL";

/** Общий тип ошибки для API-ответов. */
export type AppErrorCode =
  | BookingErrorCode
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "CONFLICT";

/** Структура ошибки, которую возвращают API-роуты. */
export type AppError = {
  error: string;
  code?: AppErrorCode;
};

/** Создать объект ошибки для JSON-ответа. */
export function appError(message: string, code?: AppErrorCode): AppError {
  return code ? { error: message, code } : { error: message };
}

/** Маппинг кода ошибки в HTTP-статус. */
export function httpStatusForCode(code: AppErrorCode | undefined): number {
  switch (code) {
    case "INVALID_INPUT":
      return 400;
    case "UNAUTHORIZED":
      return 401;
    case "SERVICE_NOT_FOUND":
    case "BARBER_NOT_FOUND":
    case "NOT_FOUND":
      return 404;
    case "SLOT_TAKEN":
    case "SLOT_UNAVAILABLE":
    case "CONFLICT":
      return 409;
    default:
      return 500;
  }
}