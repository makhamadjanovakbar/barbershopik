/**
 * Единая точка импорта утилит.
 *
 * Позволяет писать:
 *   import { todayISO, humanDate, normalizePhone } from "@/lib/utils";
 *
 * вместо:
 *   import { todayISO } from "@/lib/utils/date";
 *   import { normalizePhone } from "@/lib/utils/phone";
 */

export {
  toDateISO,
  todayISO,
  addDaysISO,
  isValidDateISO,
  weekdayOf,
  parseDateISO,
  dateWithMinutes,
  dayBounds,
  humanDate,
  humanDateTime,
  humanTime,
  timeToMinutes,
  minutesToTime,
  isValidTimeHHMM,
} from "./date";

export { phoneDigits, isValidPhone, normalizePhone } from "./phone";