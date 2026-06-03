import { buildChefSessionCookie, createChefSession } from "@/lib/auth/chef-session";
import { verifyChefPassword } from "@/lib/auth/password";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { password?: unknown } | null;
  const password = typeof body?.password === "string" ? body.password : "";

  if (!verifyChefPassword(password, process.env.CHEF_PASSWORD_HASH)) {
    return Response.json({ error: "主厨口令不对" }, { status: 401 });
  }

  const token = createChefSession();
  return new Response(null, {
    status: 204,
    headers: {
      "Set-Cookie": buildChefSessionCookie(token),
    },
  });
}
