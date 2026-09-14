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
  serializeService,
  validateServiceInput,
} from "@/lib/api";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/* ─────────────────── PATCH ─────────────────── */

/**
 * PATCH /api/admin/services/:id
 * Частичное обновление услуги.
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

  const v = validateServiceInput(body, { partial: true });
  if (!v.ok) return jsonBadRequest(v.error);

  try {
    const updated = await prisma.service.update({
      where: { id },
      data: v.data,
    });
    return jsonOk(serializeService(updated));
  } catch (e) {
    if (isPrismaError(e, "P2025")) {
      return jsonNotFound("Услуга не найдена");
    }
    console.error("PATCH /api/admin/services/:id error:", e);
    return jsonInternal("Не удалось обновить услугу");
  }
}

/* ─────────────────── DELETE ─────────────────── */

/**
 * DELETE /api/admin/services/:id
 * Удалить услугу.
 *
 * Если на услугу есть записи (FK без cascade), вернём 409 с подсказкой
 * «скрой вместо удаления».
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
    await prisma.service.delete({ where: { id } });
    return jsonOk({ ok: true });
  } catch (e) {
    if (isPrismaError(e, "P2025")) {
      return jsonNotFound("Услуга не найдена");
    }
    if (isPrismaError(e, "P2003")) {
      return jsonConflict(
        "Нельзя удалить: на услугу есть записи. Сначала скройте её.",
      );
    }
    console.error("DELETE /api/admin/services/:id error:", e);
    return jsonInternal("Не удалось удалить услугу");
  }
}

/* ─────────────────── Вспомогательное ─────────────────── */

function isPrismaError(e: unknown, code: string): boolean {
  return (
    e instanceof Prisma.PrismaClientKnownRequestError && e.code === code
  );
}