import { NextResponse } from "next/dist/server/web/spec-extension/response";
// Headless uses this hosted Shopify account flow when customer OAuth is not configured.
// Authentication is owned by Shopify; local wishlist entries are not claimed to be synced.
export async function GET() {
  const base =
    process.env.SHOPIFY_CUSTOMER_ACCOUNT_URL ||
    "https://shopify.com/63421546744/account";
  try {
    const url = new URL(`${base.replace(/\/$/, "")}/login`);
    if (url.protocol !== "https:") throw new Error("Invalid account URL");
    return NextResponse.redirect(url, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "Innlogging er midlertidig utilgjengelig." },
      { status: 503 },
    );
  }
}
