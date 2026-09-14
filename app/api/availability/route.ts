import { NextResponse, type NextRequest } from "next/server";
import {
  computeSlotsForAnyBarber,
  computeSlotsForBarber,
} from "@/lib/booking";
import { jsonBadRequest, jsonInternal } from "@/lib/api";
import { MIN_LEAD_MINUTES_WEB, SERVICE_DURATION_MAX } from "@/lib/constants";
import { isValidDateISO } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * GET /api/availability?serviceId=1&date=2025-01-15[&barberId=2]
 *
 * Если barberId передан — слоты конкретного барбера.
 * Если не передан — слоты «любого свободного» (объединение по времени старта).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const serviceIdRaw = searchParams.get("serviceId");
  const date = searchParams.get("date");
  const barberIdRaw = searchParams.get("barberId");

  /* ─────────────── Валидация query ─────────────── */

  if (!serviceIdRaw || !date) {
    return jsonBadRequest("Нужны параметры serviceId и date");
  }

  const serviceId = Number(serviceIdRaw);
  if (!Number.isInteger(serviceId) || serviceId <= 0) {
    return jsonBadRequest("Некорректный serviceId");
  }

  if (!isValidDateISO(date)) {
    return jsonBadRequest("Некорректная дата (ожидается YYYY-MM-DD)");
  }

  /* ─────────────── Расчёт слотов ─────────────── */

  try {
    // Конкретный барбер
    if (barberIdRaw) {
      const barberId = Number(barberIdRaw);
      if (!Number.isInteger(barberId) || barberId <= 0) {
        return jsonBadRequest("Некорректный barberId");
      }

      const slots = await computeSlotsForBarber({
        barberId,
        serviceId,
        dateISO: date,
        minLeadMinutes: MIN_LEAD_MINUTES_WEB,
      });

      return NextResponse.json({
        date,
        barberId,
        serviceId,
        slots,
      });
    }

    // «Любой свободный»
    const anySlots = await computeSlotsForAnyBarber({
      serviceId,
      dateISO: date,
      minLeadMinutes: MIN_LEAD_MINUTES_WEB,
    });

    return NextResponse.json({
      date,
      barberId: null,
      serviceId,
      slots: anySlots.map((x) => x.slot),
    });
  } catch (e) {
    console.error("GET /api/availability error:", e);
    return jsonInternal("Не удалось получить слоты");
  }
}