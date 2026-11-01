import * as z from '@/lib/validation/zodMini';

export const emptyCartRecommendationsSchema = z.strictObject({
  products: z.array(z.strictObject({
    variantId: z.string().check(z.regex(/^gid:\/\/shopify\/ProductVariant\/\d+$/)),
    handle: z.string().check(z.regex(/^[a-z0-9-]+$/)),
    title: z.string().check(z.minLength(1)),
    size: z.string().check(z.minLength(1)),
    price: z.strictObject({
      amount: z.string().check(z.regex(/^\d+(?:\.\d+)?$/)),
      currencyCode: z.literal('NOK'),
    }),
    image: z.strictObject({
      url: z.string().check(z.url()),
      width: z.number().check(z.int(), z.minimum(1)),
      height: z.number().check(z.int(), z.minimum(1)),
    }),
  })).check(z.maxLength(4)),
});

export type EmptyCartRecommendation = z.infer<typeof emptyCartRecommendationsSchema>['products'][number];
