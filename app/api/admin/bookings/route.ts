import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  jsonInternal,
  jsonOk,
  serializeBookingDetailed,
} from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { BOOKINGS_LOOKBACK_DAYS } from "@/lib/constants";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/bookings
 *
 * Опциональные фильтры:
 *   ?from=YYYY-MM-DD   — начало периода (по умолчанию: -30 дней)
 *   ?to=YYYY-MM-DD     — конец периода (включительно)
 *   ?barberId=N        — записи конкретного барбера
 *   ?status=confirmed|cancelled
 *
 * Возвращает записи с джойнами barber + service.
 */
export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { searchParams } = new URL(req.url);
  const fromRaw = searchParams.get("from");
  const toRaw = searchParams.get("to");
  const barberIdRaw = searchParams.get("barberId");
  const statusRaw = searchParams.get("status");

  /* ─────────────── Границы периода ─────────────── */

  // По умолчанию — от -30 дней и вперёд
  const defaultFrom = new Date();
  defaultFrom.setDate(defaultFrom.getDate() - BOOKINGS_LOOKBACK_DAYS);
  defaultFrom.setHours(0, 0, 0, 0);

  let from = defaultFrom;
  if (fromRaw) {
    const parsed = new Date(`${fromRaw}T00:00:00`);
    if (!Number.isNaN(parsed.getTime())) {
      from = parsed;
    }
  }

  let to: Date | undefined;
  if (toRaw) {
    const parsed = new Date(`${toRaw}T00:00:00`);
    if (!Number.isNaN(parsed.getTime())) {
      parsed.setDate(parsed.getDate() + 1); // включаем весь день to
      to = parsed;
    }
  }

  /* ─────────────── Where-условия ─────────────── */

  const where: {
    startsAt: { gte: Date; lt?: Date };
    barberId?: number;
    status?: string;
  } = {
    startsAt: { gte: from },
  };
  if (to) where.startsAt.lt = to;

  if (barberIdRaw) {
    const barberId = Number(barberIdRaw);
    if (Number.isInteger(barberId) && barberId > 0) {
      where.barberId = barberId;
    }
  }

  if (statusRaw === "confirmed" || statusRaw === "cancelled") {
    where.status = statusRaw;
  }

  /* ─────────────── Запрос ─────────────── */

  try {
    const rows = await prisma.booking.findMany({
      where,
      orderBy: { startsAt: "desc" },
      include: {
        barber: { select: { id: true, name: true } },
        service: {
          select: { id: true, name: true, price: true, durationMin: true },
        },
      },
    });

    return jsonOk(rows.map(serializeBookingDetailed));
  } catch (e) {
    console.error("GET /api/admin/bookings error:", e);
    return jsonInternal("Не удалось получить записи");
  }
}