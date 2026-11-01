import { NextResponse } from "next/dist/server/web/spec-extension/response";
import type { NextRequest } from "next/server";
import { z } from "zod";
// Headless uses this hosted Shopify account flow when customer OAuth is not configured.
// Authentication is owned by Shopify; local wishlist entries are not claimed to be synced.
export async function GET() {
  return accountRedirect();
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const email = z.email().max(254).safeParse(form.get("email"));
  if (!email.success) {
    return NextResponse.json(
      { error: "Skriv inn en gyldig e-postadresse." },
      { status: 400, headers: { "Cache-Control": "private, no-store" } },
    );
  }
  return accountRedirect(email.data);
}

function accountRedirect(email?: string) {
  const base =
    process.env.SHOPIFY_CUSTOMER_ACCOUNT_URL ||
    "https://shopify.com/63421546744/account";
  try {
    const url = new URL(`${base.replace(/\/$/, "")}/login`);
    if (url.protocol !== "https:") throw new Error("Invalid account URL");
    if (email) url.searchParams.set("login_hint", email);
    return NextResponse.redirect(url, {
      status: email ? 303 : 307,
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "Innlogging er midlertidig utilgjengelig." },
      { status: 503 },
    );
  }
}
