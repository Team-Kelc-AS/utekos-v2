import {
  FACEBOOK_SESSION_COOKIE,
  FACEBOOK_STATE_COOKIE,
  facebookConfig,
  readSession,
  sealSession,
} from "@/lib/facebook-login/session";
import { privateHeaders, sameOrigin } from "@/lib/cart/request";

import { NextRequest } from "next/dist/server/web/spec-extension/request";
import { NextResponse } from "next/dist/server/web/spec-extension/response";
import { z } from "zod";

const inputSchema = z.object({
  accessToken: z.string().min(20).max(4096),
  userID: z.string().regex(/^\d+$/).max(64),
});
export async function POST(request: NextRequest) {
  if (!sameOrigin(request))
    return NextResponse.json(
      { error: "Ugyldig forespørsel." },
      { status: 403, headers: privateHeaders },
    );
  try {
    const config = facebookConfig();
    const input = inputSchema.parse(await request.json());
    if (
      !readSession(request.cookies.get(FACEBOOK_STATE_COOKIE)?.value, "state")
    )
      throw new Error("Expired state");
    const url = new URL(
      `https://graph.facebook.com/${config.apiVersion}/debug_token`,
    );
    url.searchParams.set("input_token", input.accessToken);
    const result = await fetch(url, {
      headers: { Authorization: `Bearer ${config.appId}|${config.appSecret}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (!result.ok) throw new Error("Provider unavailable");
    const debug = z
      .object({
        data: z.object({
          is_valid: z.literal(true),
          app_id: z.string(),
          user_id: z.string(),
          expires_at: z.number(),
          data_access_expires_at: z.number().optional(),
        }),
      })
      .parse(await result.json()).data;
    const now = Date.now();
    if (
      debug.app_id !== config.appId ||
      debug.user_id !== input.userID ||
      debug.expires_at * 1000 <= now ||
      (debug.data_access_expires_at &&
        debug.data_access_expires_at * 1000 <= now)
    )
      throw new Error("Invalid identity");
    const expiresAt = Math.min(
      now + 86400000,
      debug.expires_at * 1000,
      debug.data_access_expires_at
        ? debug.data_access_expires_at * 1000
        : Infinity,
    );
    // Connection only: no advertising identity database, event or wishlist-sync claim.
    const response = NextResponse.json(
      { status: "connected" },
      { headers: privateHeaders },
    );
    response.cookies.set(
      FACEBOOK_SESSION_COOKIE,
      sealSession({ userId: debug.user_id, expiresAt }, "session"),
      {
        httpOnly: true,
        sameSite: "lax",
        secure: request.nextUrl.protocol === "https:",
        path: "/",
        maxAge: Math.floor((expiresAt - now) / 1000),
      },
    );
    response.cookies.set(FACEBOOK_STATE_COOKIE, "", {
      path: "/api/identity/facebook",
      maxAge: 0,
    });
    return response;
  } catch {
    return NextResponse.json(
      { error: "Facebook-tilkoblingen kunne ikke bekreftes. Prøv igjen." },
      { status: 401, headers: privateHeaders },
    );
  }
}
