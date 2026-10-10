import { getSearchIndex } from "@/lib/search/getSearchIndex";
import { connection } from "next/dist/server/request/connection";
import { unstable_rethrow } from "next/dist/client/components/unstable-rethrow";

export async function GET() {
  // Cache the validated data, never a route response produced during an outage.
  await connection();
  try {
    return Response.json(await getSearchIndex(), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    unstable_rethrow(error);
    // Do not cache a partial or empty catalog as a successful search index.
    return Response.json({ error: "Søket er midlertidig utilgjengelig." }, {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
