import "server-only";

import { errors, importPKCS8, SignJWT } from "jose";
import { cacheLife } from "next/cache";
import { z } from "zod";
import { ArticleReadershipError, articleViewsSchema, parseArticleViewsReport, rankMostReadArticles, readershipDateRange } from "./mostReadArticles";
import { knowledgeArticleList } from "./knowledgeArticles";
import recordedViews from "./articleViews.generated.json";

const credentialsSchema = z.object({
  type: z.literal("service_account"),
  client_email: z.email(),
  private_key: z.string().min(1),
});
const tokenSchema = z.object({ access_token: z.string().min(1) });
const tokenEndpoint = "https://oauth2.googleapis.com/token";

export async function fetchArticleReadership(credentialsJson: string, propertyId: string) {
  if (!/^\d+$/.test(propertyId)) throw new ArticleReadershipError("Invalid Analytics property");
  const credentials = credentialsSchema.parse(JSON.parse(credentialsJson));
  const key = await importPKCS8(credentials.private_key, "RS256");
  const assertion = await new SignJWT({ scope: "https://www.googleapis.com/auth/analytics.readonly" })
    .setProtectedHeader({ alg: "RS256" })
    .setIssuer(credentials.client_email)
    .setAudience(tokenEndpoint)
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(key);
  const tokenResponse = await fetch(tokenEndpoint, {
    method: "POST",
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
    cache: "no-store",
    signal: AbortSignal.timeout(5_000),
  });
  if (!tokenResponse.ok) throw new ArticleReadershipError("Analytics authorization failed");
  const token = tokenSchema.parse(await tokenResponse.json());
  const now = new Date();
  const period = readershipDateRange(now);
  const response = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token.access_token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      dateRanges: [period],
      dimensions: [{ name: "pagePath" }],
      metrics: [{ name: "screenPageViews" }],
      dimensionFilter: { andGroup: { expressions: [
        { filter: { fieldName: "hostName", inListFilter: { values: ["utekos.no", "www.utekos.no"] } } },
        { orGroup: { expressions: ["/uteguiden/", "/kunnskap/"].map(value => ({
          filter: { fieldName: "pagePath", stringFilter: { matchType: "BEGINS_WITH", value, caseSensitive: true } },
        })) } },
      ] } },
      limit: 10_000,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(5_000),
  });
  if (!response.ok) throw new ArticleReadershipError("Analytics readership report failed");
  const result = parseArticleViewsReport(await response.json(), period, propertyId, now.toISOString());
  if (rankMostReadArticles(knowledgeArticleList, result.rows).length !== 5) {
    throw new ArticleReadershipError("Insufficient measured articles in Analytics report");
  }
  return result;
}

export async function getArticleReadership() {
  "use cache";
  cacheLife({ stale: 3_600, revalidate: 86_400, expire: 172_800 });
  const credentials = process.env.GOOGLE_ANALYTICS_SERVICE_ACCOUNT_JSON;
  if (credentials) {
    try {
      return await fetchArticleReadership(credentials, process.env.GOOGLE_ANALYTICS_PROPERTY_ID ?? recordedViews.propertyId);
    } catch (error) {
      const expectedFailure = error instanceof ArticleReadershipError || error instanceof z.ZodError ||
        error instanceof errors.JOSEError || error instanceof SyntaxError || error instanceof TypeError ||
        (error instanceof Error && ["AbortError", "TimeoutError"].includes(error.name));
      if (!expectedFailure) throw error;
      // Keep the dated, measured report visible; never substitute editorial picks.
      console.error("[knowledge.readership] GA4 refresh failed; displaying the dated verified report.");
      cacheLife({ stale: 300, revalidate: 300, expire: 3_600 });
    }
  }
  return articleViewsSchema.parse(recordedViews);
}
