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
  validateSchedulePatch,
} from "@/lib/api";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/* ─────────────────── PATCH ─────────────────── */

/**
 * PATCH /api/admin/schedule/:id
 * Частичное обновление интервала расписания.
 *
 * Валидация startTime < endTime проводится на итоговых значениях
 * (после merge с текущей записью), потому что PATCH может прислать
 * только одно из полей.
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

  const v = validateSchedulePatch(body);
  if (!v.ok) return jsonBadRequest(v.error);

  try {
    const current = await prisma.workSchedule.findUnique({ where: { id } });
    if (!current) return jsonNotFound("Интервал не найден");

    const nextStart = v.data.startTime ?? current.startTime;
    const nextEnd = v.data.endTime ?? current.endTime;

    if (nextStart >= nextEnd) {
      return jsonBadRequest("startTime должен быть меньше endTime");
    }

    const updated = await prisma.workSchedule.update({
      where: { id },
      data: v.data,
    });

    return jsonOk(serializeSchedule(updated));
  } catch (e) {
    if (isPrismaError(e, "P2025")) {
      return jsonNotFound("Интервал не найден");
    }
    if (isPrismaError(e, "P2002")) {
      return jsonConflict("На этот день недели уже есть другое расписание");
    }
    console.error("PATCH /api/admin/schedule/:id error:", e);
    return jsonInternal("Не удалось обновить расписание");
  }
}

/* ─────────────────── DELETE ─────────────────── */

/**
 * DELETE /api/admin/schedule/:id
 * Удалить интервал расписания (день становится выходным).
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
    await prisma.workSchedule.delete({ where: { id } });
    return jsonOk({ ok: true });
  } catch (e) {
    if (isPrismaError(e, "P2025")) {
      return jsonNotFound("Интервал не найден");
    }
    console.error("DELETE /api/admin/schedule/:id error:", e);
    return jsonInternal("Не удалось удалить интервал");
  }
}

/* ─────────────────── Вспомогательное ─────────────────── */

function isPrismaError(e: unknown, code: string): boolean {
  return (
    e instanceof Prisma.PrismaClientKnownRequestError && e.code === code
  );
}