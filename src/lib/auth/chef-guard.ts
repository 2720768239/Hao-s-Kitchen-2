import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDatabase } from "@/db/client";
import type { AppDatabase } from "@/server/repositories";
import {
  CHEF_SESSION_COOKIE,
  getChefSessionTokenFromCookieHeader,
  isChefSessionTokenValid,
} from "./chef-session";

const UNAUTHORIZED_ERROR = "请先登录主厨工具台";

export async function requireChefPageSession() {
  const token = (await cookies()).get(CHEF_SESSION_COOKIE)?.value ?? null;

  if (!token || !isChefSessionTokenValid(token, getDatabase())) {
    redirect("/chef/login");
  }
}

export function requireChefApiSession(
  request: Request,
  database: AppDatabase = getDatabase(),
): Response | null {
  const token = getChefSessionTokenFromCookieHeader(request.headers.get("cookie"));

  if (!token || !isChefSessionTokenValid(token, database)) {
    return Response.json({ error: UNAUTHORIZED_ERROR }, { status: 401 });
  }

  return null;
}
