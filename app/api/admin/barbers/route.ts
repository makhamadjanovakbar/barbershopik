import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  jsonBadRequest,
  jsonInternal,
  jsonOk,
  parseJson,
  serializeBarber,
  validateBarberInput,
} from "@/lib/api";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/barbers
 * Возвращает всех барберов, включая скрытых.
 */
export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const barbers = await prisma.barber.findMany({
      orderBy: { id: "asc" },
    });
    return jsonOk(barbers.map(serializeBarber));
  } catch (e) {
    console.error("GET /api/admin/barbers error:", e);
    return jsonInternal("Не удалось получить барберов");
  }
}

/**
 * POST /api/admin/barbers
 * Создать барбера.
 */
export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const body = await parseJson(req);
  if (!body) return jsonBadRequest("Некорректный JSON");

  const v = validateBarberInput(body, { partial: false });
  if (!v.ok) return jsonBadRequest(v.error);

  // При создании поле name гарантированно есть (partial: false)
  const { name, avatarUrl, active } = v.data;

  try {
    const created = await prisma.barber.create({
      data: {
        name: name!,
        avatarUrl: avatarUrl ?? null,
        active: active ?? true,
      },
    });

    return jsonOk(serializeBarber(created), 201);
  } catch (e) {
    console.error("POST /api/admin/barbers error:", e);
    return jsonInternal("Не удалось создать барбера");
  }
}