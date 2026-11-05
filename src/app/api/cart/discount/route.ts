import type { NextRequest } from "next/server";
import { privateHeaders, sameOrigin } from "@/lib/cart/request";

// Keep old open tabs from applying the retired Comfyrobe campaign code.
export async function POST(request: NextRequest) {
  if (!sameOrigin(request))
    return Response.json(
      { error: "Ugyldig forespørsel." },
      { status: 403, headers: privateHeaders },
    );
  return Response.json(
    { error: "Tilbudet er avsluttet. Gratis frakt fra 999 kr gjelder fortsatt." },
    { status: 410, headers: privateHeaders },
  );
}
