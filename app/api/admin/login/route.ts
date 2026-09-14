import { type NextRequest } from "next/server";
import { jsonBadRequest, jsonOk, parseJson } from "@/lib/api";
import { jsonError } from "@/lib/api/http";
import { checkAdminPassword, setAdminSession } from "@/lib/auth";
import type { LoginPayload } from "@/types";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/login
 * Body: { password: string }
 */
export async function POST(req: NextRequest) {
  const body = await parseJson<Partial<LoginPayload>>(req);
  if (!body) return jsonBadRequest("Некорректный JSON");

  const password = body.password;
  if (typeof password !== "string" || password.length === 0) {
    return jsonBadRequest("Пароль не указан");
  }

  if (!checkAdminPassword(password)) {
    return jsonError("Неверный пароль", "UNAUTHORIZED");
  }

  await setAdminSession();

  return jsonOk({ ok: true });
}