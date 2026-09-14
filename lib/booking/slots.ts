import { prisma } from "@/lib/prisma";
import { SLOT_STEP_MIN } from "@/lib/constants";
import {
  dateWithMinutes,
  dayBounds,
  isValidDateISO,
  minutesToTime,
  timeToMinutes,
  weekdayOf,
} from "@/lib/utils";
import type { Slot } from "@/types";

/**
 * Расчёт свободных слотов.
 *
 * Правила:
 *  1. Берём рабочий интервал барбера на этот день недели (WorkSchedule).
 *  2. Применяем ScheduleException: выходной → пусто, override часов → сужаем.
 *  3. Вычитаем все confirmed-записи барбера на этот день.
 *  4. Идём по сетке с шагом SLOT_STEP_MIN, услуга должна влезать целиком.
 *  5. Учитываем minLeadMinutes — не предлагаем слоты ближе к «сейчас».
 *
 * Единый источник правды: и сайт, и бот используют эти функции.
 */

type ComputeForBarberParams = {
  barberId: number;
  serviceId: number;
  dateISO: string;
  /** Не предлагать слоты раньше, чем через N минут от текущего момента. */
  minLeadMinutes?: number;
};

type ComputeForAnyBarberParams = {
  serviceId: number;
  dateISO: string;
  minLeadMinutes?: number;
};

/**
 * Свободные слоты для конкретного барбера на конкретный день.
 */
export async function computeSlotsForBarber({
  barberId,
  serviceId,
  dateISO,
  minLeadMinutes = 0,
}: ComputeForBarberParams): Promise<Slot[]> {
  if (!isValidDateISO(dateISO)) return [];

  const [service, barber] = await Promise.all([
    prisma.service.findUnique({ where: { id: serviceId } }),
    prisma.barber.findUnique({ where: { id: barberId } }),
  ]);

  if (!service || !service.active) return [];
  if (!barber || !barber.active) return [];

  const duration = service.durationMin;
  const weekday = weekdayOf(dateISO);

  // 1. Рабочий интервал на этот день недели
  const schedule = await prisma.workSchedule.findUnique({
    where: { barberId_weekday: { barberId, weekday } },
  });

  if (!schedule) return [];

  let workStart = timeToMinutes(schedule.startTime);
  let workEnd = timeToMinutes(schedule.endTime);

  // 2. Исключение на конкретную дату (перекрывает график)
  const exception = await prisma.scheduleException.findUnique({
    where: { barberId_date: { barberId, date: dateISO } },
  });

  if (exception) {
    if (exception.isDayOff) return [];
    if (exception.startTime && exception.endTime) {
      workStart = timeToMinutes(exception.startTime);
      workEnd = timeToMinutes(exception.endTime);
    }
  }

  if (workEnd - workStart < duration) return [];

  // 3. Существующие confirmed-записи барбера на этот день
  const { start: dayStart, end: dayEnd } = dayBounds(dateISO);

  const bookings = await prisma.booking.findMany({
    where: {
      barberId,
      status: "confirmed",
      startsAt: { gte: dayStart, lt: dayEnd },
    },
    select: { startsAt: true, endsAt: true },
  });

  const busy = bookings.map((b) => ({
    start: b.startsAt.getHours() * 60 + b.startsAt.getMinutes(),
    end: b.endsAt.getHours() * 60 + b.endsAt.getMinutes(),
  }));

  // 4. Порог «сейчас + lead» — только для текущего дня
  const thresholdMinutes = computeThreshold(dateISO, minLeadMinutes);

  // 5. Идём по сетке
  const slots: Slot[] = [];

  for (
    let start = workStart;
    start + duration <= workEnd;
    start += SLOT_STEP_MIN
  ) {
    const end = start + duration;

    if (start < thresholdMinutes) continue;

    const overlaps = busy.some((b) => start < b.end && end > b.start);
    if (overlaps) continue;

    const startsAt = dateWithMinutes(dateISO, start);
    const endsAt = dateWithMinutes(dateISO, end);

    slots.push({
      time: minutesToTime(start),
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
    });
  }

  return slots;
}

/**
 * Свободные слоты для «любого свободного» барбера.
 * Объединяем слоты всех активных барберов по времени старта и возвращаем
 * для каждого слота конкретного barberId — чтобы потом создать Booking.
 */
export async function computeSlotsForAnyBarber({
  serviceId,
  dateISO,
  minLeadMinutes = 0,
}: ComputeForAnyBarberParams): Promise<{ slot: Slot; barberId: number }[]> {
  if (!isValidDateISO(dateISO)) return [];

  const barbers = await prisma.barber.findMany({
    where: { active: true },
    select: { id: true },
  });

  const perBarber = await Promise.all(
    barbers.map(async (b) => {
      const slots = await computeSlotsForBarber({
        barberId: b.id,
        serviceId,
        dateISO,
        minLeadMinutes,
      });
      return slots.map((slot) => ({ slot, barberId: b.id }));
    }),
  );

  // Объединяем по времени старта: первый попавшийся барбер на этот слот
  const byStart = new Map<string, { slot: Slot; barberId: number }>();
  for (const list of perBarber) {
    for (const item of list) {
      if (!byStart.has(item.slot.startsAt)) {
        byStart.set(item.slot.startsAt, item);
      }
    }
  }

  return Array.from(byStart.values()).sort(
    (a, b) =>
      new Date(a.slot.startsAt).getTime() - new Date(b.slot.startsAt).getTime(),
  );
}

/* ─────────────────── Внутренние хелперы ─────────────────── */

/**
 * Порог в минутах от начала суток, раньше которого слоты не предлагаем.
 * Работает только если `dateISO` — сегодняшний день.
 */
function computeThreshold(dateISO: string, minLeadMinutes: number): number {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  if (dateISO !== today) return -Infinity;

  return now.getHours() * 60 + now.getMinutes() + minLeadMinutes;
}