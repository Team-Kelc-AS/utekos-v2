import { NextResponse } from "next/dist/server/web/spec-extension/response";
import { connection } from "next/dist/server/request/connection";
import { privateHeaders } from "@/lib/cart/request";
import { readPublicConfig } from "@/lib/klarna/server";

export async function GET() {
  await connection();
  try {
    return NextResponse.json(readPublicConfig(), { headers: privateHeaders });
  } catch {
    return NextResponse.json(
      { error: "Klarna er midlertidig utilgjengelig." },
      { status: 503, headers: privateHeaders },
    );
  }
}
