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
  serializeBarber,
  validateBarberInput,
} from "@/lib/api";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/* ─────────────────── PATCH ─────────────────── */

/**
 * PATCH /api/admin/barbers/:id
 * Частичное обновление барбера.
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

  const v = validateBarberInput(body, { partial: true });
  if (!v.ok) return jsonBadRequest(v.error);

  try {
    const updated = await prisma.barber.update({
      where: { id },
      data: v.data,
    });
    return jsonOk(serializeBarber(updated));
  } catch (e) {
    if (isPrismaError(e, "P2025")) {
      return jsonNotFound("Барбер не найден");
    }
    console.error("PATCH /api/admin/barbers/:id error:", e);
    return jsonInternal("Не удалось обновить барбера");
  }
}

/* ─────────────────── DELETE ─────────────────── */

/**
 * DELETE /api/admin/barbers/:id
 * Удалить барбера.
 *
 * Если у барбера есть записи (FK без cascade), вернём 409 с подсказкой
 * «скрой вместо удаления». Расписание и исключения уедут автоматически
 * (onDelete: Cascade в схеме).
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
    await prisma.barber.delete({ where: { id } });
    return jsonOk({ ok: true });
  } catch (e) {
    if (isPrismaError(e, "P2025")) {
      return jsonNotFound("Барбер не найден");
    }
    if (isPrismaError(e, "P2003")) {
      return jsonConflict(
        "Нельзя удалить: у барбера есть записи. Сначала скройте его.",
      );
    }
    console.error("DELETE /api/admin/barbers/:id error:", e);
    return jsonInternal("Не удалось удалить барбера");
  }
}

/* ─────────────────── Вспомогательное ─────────────────── */

function isPrismaError(e: unknown, code: string): boolean {
  return (
    e instanceof Prisma.PrismaClientKnownRequestError && e.code === code
  );
}