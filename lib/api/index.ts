/**
 * Единая точка импорта API-хелперов.
 *
 * Позволяет писать:
 *   import { jsonOk, jsonBadRequest, parseJson, validateServiceInput, serializeBooking } from "@/lib/api";
 *
 * вместо трёх-четырёх разных импортов из ./http, ./validators, ./serializers.
 */

export {
  jsonOk,
  jsonError,
  jsonBadRequest,
  jsonUnauthorized,
  jsonNotFound,
  jsonConflict,
  jsonInternal,
  parseJson,
} from "./http";

export {
  validateBarberInput,
  validateServiceInput,
  validateScheduleInput,
  validateSchedulePatch,
  validateBookingInput,
  validateBookingStatus,
  type Validated,
  type BarberInput,
  type ServiceInput,
  type ScheduleInput,
  type SchedulePatchInput,
  type BookingInput,
  type BookingStatusInput,
} from "./validators";

export {
  serializeBooking,
  serializeBookingDetailed,
  serializeBarber,
  serializeService,
  serializeSchedule,
} from "./serializers";