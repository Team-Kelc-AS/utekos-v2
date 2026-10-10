import {
  FACEBOOK_SESSION_COOKIE,
  readSession,
} from "@/lib/facebook-login/session";

import { NextRequest } from "next/dist/server/web/spec-extension/request";
import { NextResponse } from "next/dist/server/web/spec-extension/response";
import { privateHeaders } from "@/lib/cart/request";
export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      connected: !!readSession(
        request.cookies.get(FACEBOOK_SESSION_COOKIE)?.value,
        "session",
      )?.userId,
    },
    { headers: privateHeaders },
  );
}
