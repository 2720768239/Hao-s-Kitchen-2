import { CHEF_SESSION_COOKIE } from "@/lib/auth/chef-session";

export async function POST() {
  return new Response(null, {
    status: 204,
    headers: {
      "Set-Cookie": `${CHEF_SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
    },
  });
}
