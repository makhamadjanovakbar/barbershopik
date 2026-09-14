/**
 * Единая точка импорта типов.
 *
 * Позволяет писать:
 *   import type { Barber, Service, BookingDTO } from "@/types";
 *
 * вместо:
 *   import type { Barber, Service } from "@/types/models";
 *   import type { BookingDTO } from "@/types/api";
 */

export type {
  Service,
  Barber,
  WorkSchedule,
  ScheduleException,
  Booking,
  BookingStatus,
  BookingSource,
  Slot,
} from "./models";

export type {
  ApiError,
  ApiErrorCode,
  BookingDTO,
  BookingWithDetails,
  CreateBookingPayload,
  LoginPayload,
  UpdateStatusPayload,
  AvailabilityResponse,
  WorkloadBookingItem,
  BarberWorkload,
  WorkloadResponse,
} from "./api";