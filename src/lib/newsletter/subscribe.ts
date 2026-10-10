"use server";

import * as z from "@/lib/validation/zodMini";
import { recordAcceptedForm } from "@/lib/tracking/server-forms";

export type NewsletterState = {
  status: "idle" | "success" | "error";
  message: string;
  email: string;
  invalidEmail?: boolean;
};

const emailSchema = z.email().check(z.maxLength(254));
const customerResult = z.object({
  customer: z.nullable(z.object({
    id: z.string().check(z.minLength(1)),
    defaultEmailAddress: z.nullable(z.object({ marketingState: z.string() })),
  })),
  userErrors: z.array(z.object({ message: z.string() })),
});

export async function subscribeToNewsletter(_previous: NewsletterState, form: FormData): Promise<NewsletterState> {
  const value = form.get("email");
  const email = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (!emailSchema.safeParse(email).success) {
    return { status: "error", message: "Skriv inn en gyldig e-postadresse.", email: email.slice(0, 254), invalidEmail: true };
  }
  const failure: NewsletterState = { status: "error", message: "Vi fikk ikke registrert påmeldingen. Prøv igjen litt senere.", email };
  if (form.get("website")) return failure;

  const token = process.env.SHOPIFY_ADMIN_API_TOKEN;
  const domain = process.env.SHOPIFY_STORE_DOMAIN?.replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (!token || !domain) return failure;

  async function call(query: string, variables: Record<string, unknown>) {
    const response = await fetch(`https://${domain}/admin/api/2026-10/graphql.json`, {
      method: "POST", cache: "no-store",
      headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token! },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error("newsletter_provider_unavailable");
    const result = z.object({ data: z.optional(z.record(z.string(), z.unknown())), errors: z.optional(z.array(z.unknown())) }).parse(await response.json());
    if (result.errors?.length || !result.data) throw new Error("newsletter_provider_rejected");
    return result.data;
  }

  try {
    // Upsert by email without touching names, tags, addresses or other customer data.
    const data = await call(`mutation NewsletterCustomer($input: CustomerSetInput!, $identifier: CustomerSetIdentifiers!) {
      customerSet(input: $input, identifier: $identifier) {
        customer { id defaultEmailAddress { marketingState } }
        userErrors { message }
      }
    }`, { input: { email }, identifier: { email } });
    const result = customerResult.parse(data.customerSet);
    if (result.userErrors.length || !result.customer) return failure;
    if (result.customer.defaultEmailAddress?.marketingState === "SUBSCRIBED") {
      return { status: "success", message: "Denne e-postadressen er allerede påmeldt nyhetsbrevet.", email: "" };
    }

    const consentData = await call(`mutation NewsletterConsent($input: CustomerEmailMarketingConsentUpdateInput!) {
      customerEmailMarketingConsentUpdate(input: $input) {
        customer { id defaultEmailAddress { marketingState } }
        userErrors { message }
      }
    }`, {
      input: {
        customerId: result.customer.id,
        emailMarketingConsent: { marketingState: "SUBSCRIBED", marketingOptInLevel: "SINGLE_OPT_IN", consentUpdatedAt: new Date().toISOString() },
      },
    });
    const consent = customerResult.parse(consentData.customerEmailMarketingConsentUpdate);
    if (consent.userErrors.length || consent.customer?.id !== result.customer.id || consent.customer.defaultEmailAddress?.marketingState !== "SUBSCRIBED") return failure;
  } catch {
    return failure;
  }

  await recordAcceptedForm(form, "newsletter_signup");
  return { status: "success", message: "Takk! Du er nå påmeldt Utekos sitt nyhetsbrev.", email: "" };
}
