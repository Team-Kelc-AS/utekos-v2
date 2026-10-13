import { z } from "zod";

export const inputSchema = z.object({
  location: z.string().meta({ description: "City name" }),
  unit: z.enum(["celsius", "fahrenheit"]).optional(),
});
