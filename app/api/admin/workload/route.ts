import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  jsonBadRequest,
  jsonInternal,
  jsonOk,
} from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import {
  dayBounds,
  isValidDateISO,
  timeToMinutes,
  weekdayOf,
} from "@/lib/utils";
import type {
  BarberWorkload,
  WorkloadBookingItem,
  WorkloadResponse,
} from "@/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/workload?date=YYYY-MM-DD
 *
 * Для каждого активного барбера считает:
 *   totalMinutes  — длительность рабочего интервала на этот день недели
 *                   (или override из ScheduleException; выходной → 0);
 *   bookedMinutes — сумма confirmed-записей в минутах;
 *   occupancy     — процент загрузки (0..100);
 *   bookings      — список записей (включая отменённые, помеченные статусом).
 */
export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");

  if (!date || !isValidDateISO(date)) {
    return jsonBadRequest("Нужен параметр date в формате YYYY-MM-DD");
  }

  try {
    const weekday = weekdayOf(date);
    const { start: dayStart, end: dayEnd } = dayBounds(date);

    const barbers = await prisma.barber.findMany({
      where: { active: true },
      orderBy: { id: "asc" },
      select: { id: true, name: true },
    });

    if (barbers.length === 0) {
      return jsonOk<WorkloadResponse>({ date, barbers: [] });
    }

    const barberIds = barbers.map((b) => b.id);

    /* ─────────────── Три параллельных запроса ─────────────── */

    const [schedules, exceptions, bookings] = await Promise.all([
      prisma.workSchedule.findMany({
        where: { barberId: { in: barberIds }, weekday },
        select: { barberId: true, startTime: true, endTime: true },
      }),
      prisma.scheduleException.findMany({
        where: { barberId: { in: barberIds }, date },
        select: {
          barberId: true,
          startTime: true,
          endTime: true,
          isDayOff: true,
        },
      }),
      prisma.booking.findMany({
        where: {
          barberId: { in: barberIds },
          startsAt: { gte: dayStart, lt: dayEnd },
        },
        orderBy: { startsAt: "asc" },
        include: {
          service: { select: { name: true } },
        },
      }),
    ]);

    /* ─────────────── Индексация для O(1) ─────────────── */

    const scheduleMap = new Map(
      schedules.map((s) => [
        s.barberId,
        { startTime: s.startTime, endTime: s.endTime },
      ]),
    );

    const exceptionMap = new Map(
      exceptions.map((e) => [
        e.barberId,
        {
          startTime: e.startTime,
          endTime: e.endTime,
          isDayOff: e.isDayOff,
        },
      ]),
    );

    const bookingsByBarber = new Map<number, typeof bookings>();
    for (const b of bookings) {
      const list = bookingsByBarber.get(b.barberId) ?? [];
      list.push(b);
      bookingsByBarber.set(b.barberId, list);
    }

    /* ─────────────── Расчёт по каждому барберу ─────────────── */

    const result: BarberWorkload[] = barbers.map((barber) => {
      const exception = exceptionMap.get(barber.id);
      const schedule = scheduleMap.get(barber.id);

      // Рабочие минуты на этот день
      let totalMinutes = 0;
      if (exception?.isDayOff) {
        totalMinutes = 0;
      } else if (exception?.startTime && exception?.endTime) {
        totalMinutes = Math.max(
          0,
          timeToMinutes(exception.endTime) - timeToMinutes(exception.startTime),
        );
      } else if (schedule) {
        totalMinutes = Math.max(
          0,
          timeToMinutes(schedule.endTime) - timeToMinutes(schedule.startTime),
        );
      }

      const barberBookings = bookingsByBarber.get(barber.id) ?? [];

      const bookedMinutes = barberBookings
        .filter((b) => b.status === "confirmed")
        .reduce((sum, b) => {
          const mins = Math.round(
            (b.endsAt.getTime() - b.startsAt.getTime()) / 60_000,
          );
          return sum + Math.max(0, mins);
        }, 0);

      const occupancy =
        totalMinutes > 0
          ? Math.min(100, Math.round((bookedMinutes / totalMinutes) * 100))
          : 0;

      const items: WorkloadBookingItem[] = barberBookings.map((b) => ({
        id: b.id,
        startsAt: b.startsAt.toISOString(),
        endsAt: b.endsAt.toISOString(),
        serviceName: b.service.name,
        clientName: b.clientName,
        clientPhone: b.clientPhone,
        status: b.status === "cancelled" ? "cancelled" : "confirmed",
      }));

      return {
        barberId: barber.id,
        barberName: barber.name,
        totalMinutes,
        bookedMinutes,
        occupancy,
        bookings: items,
      };
    });

    return jsonOk<WorkloadResponse>({ date, barbers: result });
  } catch (e) {
    console.error("GET /api/admin/workload error:", e);
    return jsonInternal("Не удалось получить загруженность");
  }
}