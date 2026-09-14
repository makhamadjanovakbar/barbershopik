/**
 * Единая точка импорта booking-логики.
 *
 * Позволяет писать:
 *   import { computeSlotsForBarber, createBooking, cancelBooking } from "@/lib/booking";
 *
 * и использовать одни и те же функции на сайте (через API-роуты)
 * и в Telegram-боте.
 */

export {
  computeSlotsForBarber,
  computeSlotsForAnyBarber,
} from "./slots";

export {
  createBooking,
  cancelBooking,
  getBooking,
  listBookingsByTelegramId,
  type CreateBookingInput,
  type CreateBookingResult,
} from "./create";