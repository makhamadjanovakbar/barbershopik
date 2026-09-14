import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  jsonBadRequest,
  jsonInternal,
  jsonNotFound,
  jsonOk,
  parseJson,
  serializeBookingDetailed,
  validateBookingInput,
} from "@/lib/api";
import { createBooking } from "@/lib/booking";
import { httpStatusForCode } from "@/lib/errors";

export const dynamic = "force-dynamic";

/**
 * POST /api/bookings
 * Создать запись. Тело: CreateBookingPayload.
 */
export async function POST(req: NextRequest) {
  const body = await parseJson(req);
  if (!body) return jsonBadRequest("Некорректный JSON");

  const v = validateBookingInput(body);
  if (!v.ok) return jsonBadRequest(v.error);

  const result = await createBooking({
    serviceId: v.data.serviceId,
    barberId: v.data.barberId,
    clientName: v.data.clientName,
    clientPhone: v.data.clientPhone,
    startsAt: v.data.startsAt,
    source: v.data.source,
    telegramId: v.data.telegramId,
  });

  if (!result.ok) {
    return jsonErrorFromCode(result.error, result.code);
  }

  return jsonOk(result.booking, 201);
}

/**
 * GET /api/bookings?id=N           — одна запись по id
 * GET /api/bookings?telegramId=X   — активные записи клиента (для бота)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const idRaw = searchParams.get("id");
  const telegramId = searchParams.get("telegramId");

  try {
    if (idRaw) {
      const id = Number(idRaw);
      if (!Number.isInteger(id) || id <= 0) {
        return jsonBadRequest("Некорректный id");
      }

      const booking = await prisma.booking.findUnique({
        where: { id },
        include: {
          barber: { select: { id: true, name: true } },
          service: {
            select: { id: true, name: true, price: true, durationMin: true },
          },
        },
      });

      if (!booking) return jsonNotFound("Запись не найдена");

      return jsonOk(serializeBookingDetailed(booking));
    }

    if (telegramId) {
      const rows = await prisma.booking.findMany({
        where: { telegramId, status: "confirmed" },
        orderBy: { startsAt: "asc" },
        include: {
          barber: { select: { id: true, name: true } },
          service: {
            select: { id: true, name: true, price: true, durationMin: true },
          },
        },
      });

      return jsonOk(rows.map(serializeBookingDetailed));
    }

    return jsonBadRequest("Укажите id или telegramId");
  } catch (e) {
    console.error("GET /api/bookings error:", e);
    return jsonInternal("Не удалось получить записи");
  }
}

/* ─────────────────── Вспомогательный маппинг ─────────────────── */

import { NextResponse } from "next/server";
import type { BookingErrorCode } from "@/lib/errors";

function jsonErrorFromCode(
  message: string,
  code: BookingErrorCode,
): NextResponse {
  return NextResponse.json(
    { error: message, code },
    { status: httpStatusForCode(code) },
  );
}