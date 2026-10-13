import { toolDefinition } from "@tanstack/ai/client";
import { z } from "zod";

export const getWeatherDef = toolDefinition({
  name: "get_weather",
  description: "Get the current weather for a location",
  inputSchema: z.object({
    location: z.string().meta({ description: "City and state" }),
    unit: z.enum(["celsius", "fahrenheit"]).optional(),
  }),
  outputSchema: z.object({ temperature: z.number(), conditions: z.string(), location: z.string() }),
});

export function createGetWeatherTool(
  getWeather: (input: { location: string; unit?: "celsius" | "fahrenheit" }) => Promise<{
    temperature: number; conditions: string; location: string;
  }>,
) {
  return getWeatherDef.server(getWeather);
}

export const addToCartDef = toolDefinition({
  name: "add_to_cart",
  description: "Add item to shopping cart",
  inputSchema: z.object({ itemId: z.string(), quantity: z.number().int().positive() }),
  outputSchema: z.object({ success: z.boolean(), cartId: z.string() }),
  needsApproval: true,
});

export type CartToolHandler = (input: { itemId: string; quantity: number }) => Promise<{
  success: boolean; cartId: string;
}>;

// Supply the application's cart mutation; never substitute wishlist storage.
export function createAddToCartServer(addToCart: CartToolHandler) {
  return addToCartDef.server(addToCart);
}

export function createAddToCartClient(addToCart: CartToolHandler) {
  return addToCartDef.client(addToCart);
}

export const writeFileDef = toolDefinition({
  name: "write_file",
  description: "Write a file",
  inputSchema: z.object({ path: z.string(), content: z.string() }),
});

export const runTestsDef = toolDefinition({
  name: "run_tests",
  description: "Run the test suite",
  inputSchema: z.object({}),
});
