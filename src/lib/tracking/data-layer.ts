// Use the pinned builders; GTM receives their existing field contracts unchanged.
import type { CanonicalEvent } from '@/lib/analytics/canonicalEvent';
import { buildPageViewDataLayerEvent } from '@/lib/analytics/pageViewEvent';
import { buildViewItemDataLayerEvent } from '@/lib/analytics/viewItemEvent';
import { buildViewItemListDataLayerEvent } from '@/lib/analytics/viewItemListEvent';
import { buildSelectItemDataLayerEvent } from '@/lib/analytics/selectItemEvent';
import { buildVariantSelectDataLayerEvent } from '@/lib/analytics/variantSelectEvent';
import { buildAddToCartDataLayerEvent } from '@/lib/analytics/addToCartEvent';
import { buildRemoveFromCartDataLayerEvent } from '@/lib/analytics/removeFromCartEvent';
import { buildViewCartDataLayerEvent } from '@/lib/analytics/viewCartEvent';
import { buildAddToWishlistDataLayerEvent } from '@/lib/analytics/addToWishlistEvent';
import { buildBeginCheckoutDataLayerEvent } from '@/lib/analytics/beginCheckoutEvent';
import { buildViewPromotionDataLayerEvent } from '@/lib/analytics/viewPromotionEvent';
import { buildSelectPromotionDataLayerEvent } from '@/lib/analytics/selectPromotionEvent';
import { buildViewCategoryDataLayerEvent } from '@/lib/analytics/viewCategoryEvent';
import { buildScrollDepthDataLayerEvent } from '@/lib/analytics/scrollDepthEvent';
import { buildHeroInteractDataLayerEvent } from '@/lib/analytics/heroInteractEvent';
import { buildInteractWithAccordionDataLayerEvent } from '@/lib/analytics/interactWithAccordionEvent';
import { buildGenerateLeadDataLayerEvent } from '@/lib/analytics/generateLeadEvent';

export function buildDataLayer(event: CanonicalEvent): Record<string, unknown> {
  switch (event.event_name) {
    case 'page_view': return buildPageViewDataLayerEvent(event);
    case 'view_item': return buildViewItemDataLayerEvent(event);
    case 'view_item_list': return buildViewItemListDataLayerEvent(event);
    case 'select_item': return buildSelectItemDataLayerEvent(event);
    case 'variant_select': return buildVariantSelectDataLayerEvent(event);
    case 'add_to_cart': return buildAddToCartDataLayerEvent(event);
    case 'remove_from_cart': return buildRemoveFromCartDataLayerEvent(event);
    case 'view_cart': return buildViewCartDataLayerEvent(event);
    case 'add_to_wishlist': return buildAddToWishlistDataLayerEvent(event);
    case 'begin_checkout': return buildBeginCheckoutDataLayerEvent(event);
    case 'view_promotion': return buildViewPromotionDataLayerEvent(event);
    case 'select_promotion': return buildSelectPromotionDataLayerEvent(event);
    case 'view_category': return buildViewCategoryDataLayerEvent(event);
    case 'scroll_depth': return buildScrollDepthDataLayerEvent(event);
    case 'hero_interact': return buildHeroInteractDataLayerEvent(event);
    case 'interact_with_accordion': return buildInteractWithAccordionDataLayerEvent(event);
    case 'generate_lead': return buildGenerateLeadDataLayerEvent(event);
    default: return { event: event.event_name, event_id: event.event_id, event_time: event.event_time, source: event.source, ...('page_view_id' in event ? { page_view_id: event.page_view_id } : {}), ...('custom_data' in event ? { custom_data: event.custom_data } : {}), canonical_event: event };
  }
}
