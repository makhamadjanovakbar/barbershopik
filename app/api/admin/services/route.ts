import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  jsonBadRequest,
  jsonInternal,
  jsonOk,
  parseJson,
  serializeService,
  validateServiceInput,
} from "@/lib/api";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/services
 * Возвращает все услуги, включая скрытые.
 */
export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const services = await prisma.service.findMany({
      orderBy: { id: "asc" },
    });
    return jsonOk(services.map(serializeService));
  } catch (e) {
    console.error("GET /api/admin/services error:", e);
    return jsonInternal("Не удалось получить услуги");
  }
}

/**
 * POST /api/admin/services
 * Создать услугу.
 */
export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const body = await parseJson(req);
  if (!body) return jsonBadRequest("Некорректный JSON");

  const v = validateServiceInput(body, { partial: false });
  if (!v.ok) return jsonBadRequest(v.error);

  // При создании name, durationMin, price гарантированно есть (partial: false)
  const { name, durationMin, price, active } = v.data;

  try {
    const created = await prisma.service.create({
      data: {
        name: name!,
        durationMin: durationMin!,
        price: price!,
        active: active ?? true,
      },
    });

    return jsonOk(serializeService(created), 201);
  } catch (e) {
    console.error("POST /api/admin/services error:", e);
    return jsonInternal("Не удалось создать услугу");
  }
}