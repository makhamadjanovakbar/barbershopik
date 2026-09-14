import { Prisma } from "@prisma/client";
import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  jsonBadRequest,
  jsonConflict,
  jsonInternal,
  jsonNotFound,
  jsonOk,
  parseJson,
  serializeSchedule,
  validateScheduleInput,
} from "@/lib/api";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/schedule?barberId=1
 * Все интервалы расписания барбера (7 дней максимум).
 */
export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { searchParams } = new URL(req.url);
  const barberIdRaw = searchParams.get("barberId");

  if (!barberIdRaw) {
    return jsonBadRequest("Нужен параметр barberId");
  }

  const barberId = Number(barberIdRaw);
  if (!Number.isInteger(barberId) || barberId <= 0) {
    return jsonBadRequest("Некорректный barberId");
  }

  try {
    const rows = await prisma.workSchedule.findMany({
      where: { barberId },
      orderBy: { weekday: "asc" },
    });

    return jsonOk(rows.map(serializeSchedule));
  } catch (e) {
    console.error("GET /api/admin/schedule error:", e);
    return jsonInternal("Не удалось получить расписание");
  }
}

/**
 * POST /api/admin/schedule
 * Создать интервал расписания (день недели + часы).
 * Body: { barberId, weekday, startTime, endTime }
 */
export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const body = await parseJson(req);
  if (!body) return jsonBadRequest("Некорректный JSON");

  const v = validateScheduleInput(body);
  if (!v.ok) return jsonBadRequest(v.error);

  const { barberId, weekday, startTime, endTime } = v.data;

  try {
    // Проверим, что барбер существует
    const barber = await prisma.barber.findUnique({ where: { id: barberId } });
    if (!barber) return jsonNotFound("Барбер не найден");

    const created = await prisma.workSchedule.create({
      data: { barberId, weekday, startTime, endTime },
    });

    return jsonOk(serializeSchedule(created), 201);
  } catch (e) {
    if (isPrismaError(e, "P2002")) {
      return jsonConflict("Расписание на этот день недели уже существует");
    }
    console.error("POST /api/admin/schedule error:", e);
    return jsonInternal("Не удалось создать расписание");
  }
}

/* ─────────────────── Вспомогательное ─────────────────── */

function isPrismaError(e: unknown, code: string): boolean {
  return (
    e instanceof Prisma.PrismaClientKnownRequestError && e.code === code
  );
}