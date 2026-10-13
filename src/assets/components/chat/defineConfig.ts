import "server-only";
import { generateCatalog } from "@tanstack/ai-skills/node";
import { staticSkills } from "@tanstack/ai-skills/static";

// Next.js does not run Vite plugins. Generate a catalog explicitly on the server.
export async function createChatSkills(directory: string) {
  return staticSkills(await generateCatalog(directory));
}
