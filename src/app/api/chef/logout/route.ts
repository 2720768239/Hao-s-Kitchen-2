import { requireChefApiSession } from "@/lib/auth/chef-guard";
import { CHEF_SESSION_COOKIE, destroyChefSession, getChefSessionTokenFromCookieHeader } from "@/lib/auth/chef-session";

export async function POST(request: Request) {
  const unauthorized = requireChefApiSession(request);
  if (unauthorized) {
    return unauthorized;
  }

  const token = getChefSessionTokenFromCookieHeader(request.headers.get("cookie"));

  if (token) {
    destroyChefSession(token);
  }

  return new Response(null, {
    status: 204,
    headers: {
      "Set-Cookie": `${CHEF_SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
    },
  });
}
