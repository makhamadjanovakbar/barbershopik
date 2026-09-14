import { prisma } from "@/lib/prisma";
import { jsonOk, jsonInternal, serializeService } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * GET /api/services
 * Публичный endpoint. Возвращает только активные услуги.
 */
export async function GET() {
  try {
    const services = await prisma.service.findMany({
      where: { active: true },
      orderBy: { id: "asc" },
    });

    return jsonOk(services.map(serializeService));
  } catch (e) {
    console.error("GET /api/services error:", e);
    return jsonInternal("Не удалось получить услуги");
  }
}