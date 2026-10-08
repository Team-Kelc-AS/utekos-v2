import { z } from 'zod';
import { canonicalPageViewSchema } from '@/lib/analytics/pageViewEvent';
import { canonicalViewItemSchema } from '@/lib/analytics/viewItemEvent';
import { canonicalViewItemListSchema } from '@/lib/analytics/viewItemListEvent';
import { canonicalSelectItemSchema } from '@/lib/analytics/selectItemEvent';
import { canonicalVariantSelectSchema } from '@/lib/analytics/variantSelectEvent';
import { canonicalAddToCartSchema } from '@/lib/analytics/addToCartEvent';
import { canonicalRemoveFromCartSchema } from '@/lib/analytics/removeFromCartEvent';
import { canonicalViewCartSchema } from '@/lib/analytics/viewCartEvent';
import { canonicalAddToWishlistSchema } from '@/lib/analytics/addToWishlistEvent';
import { canonicalBeginCheckoutSchema } from '@/lib/analytics/beginCheckoutEvent';
import { canonicalViewPromotionSchema } from '@/lib/analytics/viewPromotionEvent';
import { canonicalSelectPromotionSchema } from '@/lib/analytics/selectPromotionEvent';
import { canonicalViewCategorySchema } from '@/lib/analytics/viewCategoryEvent';
import { canonicalScrollDepthSchema } from '@/lib/analytics/scrollDepthEvent';
import { canonicalHeroInteractSchema } from '@/lib/analytics/heroInteractEvent';
import { canonicalInteractWithAccordionSchema } from '@/lib/analytics/interactWithAccordionEvent';
import { canonicalSizeGuideViewSchema } from '@/lib/analytics/sizeGuideViewEvent';
import { canonicalFormStartSchema } from '@/lib/analytics/formStartEvent';
import { canonicalFormErrorSchema } from '@/lib/analytics/formErrorEvent';
import { canonicalVideoProgressSchema } from '@/lib/analytics/videoProgressEvent';

// Full pinned union includes server crypto for Purchase/refunds. Client imports only real v2 browser producers.
export const browserEventSchema = z.discriminatedUnion('event_name', [canonicalPageViewSchema, canonicalViewItemSchema, canonicalViewItemListSchema, canonicalSelectItemSchema, canonicalVariantSelectSchema, canonicalAddToCartSchema, canonicalRemoveFromCartSchema, canonicalViewCartSchema, canonicalAddToWishlistSchema, canonicalBeginCheckoutSchema, canonicalViewPromotionSchema, canonicalSelectPromotionSchema, canonicalViewCategorySchema, canonicalScrollDepthSchema, canonicalHeroInteractSchema, canonicalInteractWithAccordionSchema, canonicalSizeGuideViewSchema, canonicalFormStartSchema, canonicalFormErrorSchema, canonicalVideoProgressSchema]);
