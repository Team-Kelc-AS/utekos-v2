import { privateHeaders, sameOrigin } from "@/lib/cart/request";

import { FACEBOOK_SESSION_COOKIE } from "@/lib/facebook-login/session";
import { NextRequest } from "next/dist/server/web/spec-extension/request";
import { NextResponse } from "next/dist/server/web/spec-extension/response";
export async function POST(request: NextRequest) {
  if (!sameOrigin(request))
    return NextResponse.json(
      { error: "Ugyldig forespørsel." },
      { status: 403, headers: privateHeaders },
    );
  const response = NextResponse.json(
    { connected: false },
    { headers: privateHeaders },
  );
  response.cookies.delete(FACEBOOK_SESSION_COOKIE);
  return response;
}
