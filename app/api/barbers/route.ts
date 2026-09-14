import { prisma } from "@/lib/prisma";
import { jsonOk, jsonInternal, serializeBarber } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * GET /api/barbers
 * Публичный endpoint. Возвращает только активных барберов.
 */
export async function GET() {
  try {
    const barbers = await prisma.barber.findMany({
      where: { active: true },
      orderBy: { id: "asc" },
    });

    return jsonOk(barbers.map(serializeBarber));
  } catch (e) {
    console.error("GET /api/barbers error:", e);
    return jsonInternal("Не удалось получить барберов");
  }
}