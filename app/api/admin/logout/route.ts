import { jsonOk } from "@/lib/api";
import { clearAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/logout
 * Удаляет сессионную cookie администратора.
 */
export async function POST() {
  await clearAdminSession();
  return jsonOk({ ok: true });
}