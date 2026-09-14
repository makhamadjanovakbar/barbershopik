import { Prisma } from "@prisma/client";
import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  jsonBadRequest,
  jsonInternal,
  jsonNotFound,
  jsonOk,
  parseJson,
  serializeBookingDetailed,
  validateBookingStatus,
} from "@/lib/api";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/* ─────────────────── PATCH ─────────────────── */

/**
 * PATCH /api/admin/bookings/:id
 * Body: { status: "confirmed" | "cancelled" }
 *
 * Используется кнопками «Отменить» и «Восстановить» в админке.
 * Отменённые записи не удаляются — они остаются в БД, но пропадают
 * из расчёта слотов (computeSlotsForBarber фильтрует status: "confirmed").
 */
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id: idRaw } = await params;
  const id = Number(idRaw);
  if (!Number.isInteger(id) || id <= 0) {
    return jsonBadRequest("Некорректный id");
  }

  const body = await parseJson(req);
  if (!body) return jsonBadRequest("Некорректный JSON");

  const v = validateBookingStatus(body);
  if (!v.ok) return jsonBadRequest(v.error);

  try {
    const updated = await prisma.booking.update({
      where: { id },
      data: { status: v.data.status },
      include: {
        barber: { select: { id: true, name: true } },
        service: {
          select: { id: true, name: true, price: true, durationMin: true },
        },
      },
    });

    return jsonOk(serializeBookingDetailed(updated));
  } catch (e) {
    if (isPrismaError(e, "P2025")) {
      return jsonNotFound("Запись не найдена");
    }
    console.error("PATCH /api/admin/bookings/:id error:", e);
    return jsonInternal("Не удалось обновить запись");
  }
}

/* ─────────────────── DELETE ─────────────────── */

/**
 * DELETE /api/admin/bookings/:id
 * Полное физическое удаление записи из БД.
 *
 * В отличие от PATCH (смена статуса на cancelled), здесь запись
 * удаляется безвозвратно. Используется кнопкой «Удалить» с
 * подтверждением «Удалить навсегда?».
 */
export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id: idRaw } = await params;
  const id = Number(idRaw);
  if (!Number.isInteger(id) || id <= 0) {
    return jsonBadRequest("Некорректный id");
  }

  try {
    await prisma.booking.delete({ where: { id } });
    return jsonOk({ ok: true });
  } catch (e) {
    if (isPrismaError(e, "P2025")) {
      return jsonNotFound("Запись не найдена");
    }
    console.error("DELETE /api/admin/bookings/:id error:", e);
    return jsonInternal("Не удалось удалить запись");
  }
}

/* ─────────────────── Вспомогательное ─────────────────── */

function isPrismaError(e: unknown, code: string): boolean {
  return (
    e instanceof Prisma.PrismaClientKnownRequestError && e.code === code
  );
}