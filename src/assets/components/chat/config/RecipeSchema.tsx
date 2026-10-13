import { z } from "zod";

export const RecipeSchema = z.object({
  title: z.string(),
  cuisine: z.string(),
  servings: z.number(),
  estimatedCostUsd: z.number(),
  ingredients: z.array(z.object({ item: z.string(), amount: z.string() })),
  steps: z.array(z.string()),
  tips: z.array(z.string()),
});

export type Recipe = z.infer<typeof RecipeSchema>;

