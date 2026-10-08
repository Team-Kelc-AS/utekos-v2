'use client';
import { canonicalCommerceValueSchema, type CanonicalCommerceValue } from '@/lib/analytics/canonicalCommerceItem';
import { getVariantIntent, clearVariantIntent } from './variant-selection';
import { selectionKey } from './selection-key';
import { createJourneyReporter } from './journey';
import { journeySectionSchema, sanitizeJourneyPath, type JourneySection } from '@/lib/observability/journey/contract';
import { claimObservation, reportInteraction, captureFormTrackingContext, reportNavigation } from './runtime';

function commerce(element: Element | null): CanonicalCommerceValue | undefined {
  const raw = element?.getAttribute('data-tracking-commerce');
  if (!raw) return;
  try { return canonicalCommerceValueSchema.parse(JSON.parse(raw)); } catch { return; }
}
function onCurrentRoute(element: Element) {
  const page = element.closest('[data-tracking-page]')?.getAttribute('data-tracking-page');
  const currentPage = String(Number(new URLSearchParams(location.search).get('page') ?? '1'));
  return element.isConnected && (!page || page === currentPage) && element.closest('[data-tracking-route]')?.getAttribute('data-tracking-route') === location.pathname;
}
function currentProductElement() {
  const element = document.querySelector('[data-tracking-product]');
  if (!element || element.getAttribute('data-tracking-selection') !== selectionKey(new URLSearchParams(location.search))) return;
  if (element.getAttribute('data-tracking-product') !== location.pathname) return;
  return element;
}
function currentProduct() { return commerce(currentProductElement() ?? null); }
function list(element: Element) {
  const parent = element.closest('[data-tracking-list]');
  return { id: parent?.getAttribute('data-tracking-list') ?? location.pathname,
    name: parent?.getAttribute('data-tracking-list-name') ?? document.title };
}
function promotion(element: Element) {
  return { promotion_id: element.getAttribute('data-tracking-promotion')!,
    creative_name: element.getAttribute('data-tracking-creative') ?? element.getAttribute('data-tracking-promotion')!,
    creative_slot: element.getAttribute('data-tracking-slot') ?? 'content' };
}
export function observeStorefront() {
  const recordJourney = createJourneyReporter();
  const watched = new WeakMap<Element, Element>();
  const contexts = new WeakMap<Element, Element>();
  const dwell = new Map<Element, ReturnType<typeof setTimeout>>();
  const openCounts = new WeakMap<Element, number>();
  const videoMilestones = new WeakMap<Element, Set<number>>();
  const lists = new Map<string, { sequence: number; timer?: ReturnType<typeof setTimeout>; pending: Map<string, { value: CanonicalCommerceValue; total: number }>; name: string }>();
  let clickSequence = 0;
  let frame = 0;
  let maxScrollY = 0;
  let maxScrollPercent = 0;
  let progressSignature = '';
  let lastVisibleSection: JourneySection | undefined;
  const toScan = new Set<Element>();
  const round = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
  const sections = new Set<Element>();
  const sectionTimers = new Map<Element, ReturnType<typeof setTimeout>>();
  const sectionObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const existing = sectionTimers.get(entry.target); if (existing) clearTimeout(existing); sectionTimers.delete(entry.target);
      const section = journeySectionSchema.safeParse(entry.target.getAttribute('data-journey-section'));
      if (!section.success || !entry.isIntersecting || !onCurrentRoute(entry.target) || document.visibilityState === 'hidden') continue;
      sectionTimers.set(entry.target, setTimeout(() => {
        sectionTimers.delete(entry.target);
        const rect = entry.target.getBoundingClientRect();
        if (!onCurrentRoute(entry.target) || document.visibilityState === 'hidden' || rect.bottom <= 0 || rect.top >= innerHeight || rect.width <= 0 || rect.height <= 0) return;
        lastVisibleSection = section.data;
        if (claimObservation(`journey-section:${section.data}`)) recordJourney('section_view', { section_id: section.data, dwell_ms: 1000 });
      }, 1000));
    }
  }, { threshold: 0 });
  function qualify(element: Element) {
    if (!onCurrentRoute(element) || document.visibilityState === 'hidden') return;
    const value = commerce(element);
    if (value && element.hasAttribute('data-tracking-product')) {
      if (currentProductElement() !== element) return;
      if (claimObservation(`view-item:${value.items[0].variant_id}`)) reportInteraction('view_item', value);
    } else if (value) {
      const group = list(element);
      if (!claimObservation(`list:${group.id}:${value.items[0].variant_id}`)) return;
      let state = lists.get(group.id);
      if (!state) { state = { sequence: 0, pending: new Map(), name: group.name }; lists.set(group.id, state); }
      state.pending.set(value.items[0].variant_id, { value, total: element.closest('[data-tracking-list]')?.querySelectorAll('[data-tracking-commerce]').length ?? 1 });
      const listState = state;
      listState.timer ??= setTimeout(() => {
        listState.timer = undefined;
        const entries = [...listState.pending.values()]; listState.pending.clear();
        for (let index = 0; index < entries.length; index += 20) {
          const chunk = entries.slice(index, index + 20);
          if (!chunk.length || chunk.some(item => item.value.currency !== chunk[0].value.currency)) continue;
          reportInteraction('view_item_list', { currency: chunk[0].value.currency,
            value: round(chunk.reduce((sum,item) => sum + item.value.value,0)),
            gross_value: round(chunk.reduce((sum,item) => sum + item.value.gross_value,0)),
            tax_value: round(chunk.reduce((sum,item) => sum + item.value.tax_value,0)),
            items: chunk.flatMap(item => item.value.items), item_list_id: group.id, item_list_name: listState.name,
            impression_sequence: ++listState.sequence, total_item_count: Math.max(...chunk.map(item => item.total)),
          });
        }
      }, 50);
    }
    if (element.hasAttribute('data-tracking-promotion') && claimObservation(`promotion:${element.getAttribute('data-tracking-promotion')}`)) {
      reportInteraction('view_promotion', { ...promotion(element), impression_sequence: 1 });
    }
    if (element.hasAttribute('data-tracking-category') && claimObservation(`category:${element.getAttribute('data-tracking-category')}`)) {
      reportInteraction('view_category', { category_id: element.getAttribute('data-tracking-category'),
        category_name: element.getAttribute('data-tracking-category-name') ?? document.title, view_sequence: 1 });
    }
  }
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const element = contexts.get(entry.target) ?? entry.target;
      if (!entry.isIntersecting || entry.intersectionRatio < .5 || !onCurrentRoute(element) || document.visibilityState === 'hidden') {
        const timer = dwell.get(element); if (timer) clearTimeout(timer); dwell.delete(element); continue;
      }
      if (element.hasAttribute('data-tracking-product') || element.hasAttribute('data-tracking-category')) qualify(element);
      else if (!dwell.has(element)) dwell.set(element, setTimeout(() => { dwell.delete(element); qualify(element); }, 1000));
    }
  }, { threshold: [.5] });
  const selector = '[data-tracking-commerce], [data-tracking-promotion], [data-tracking-category]';
  function watch(element: Element, force = false) {
    if (!element.matches(selector)) return;
    const target = element.hasAttribute('data-tracking-product') || element.hasAttribute('data-tracking-category')
      ? element.querySelector('h1, h2') ?? element : element;
    const previous = watched.get(element);
    if (previous && !force && previous === target) return;
    if (previous) observer.unobserve(previous);
    const timer = dwell.get(element); if (timer) clearTimeout(timer); dwell.delete(element);
    watched.set(element, target); contexts.set(target, element); observer.observe(target);
  }
  function commitVariant() {
    const element = currentProductElement();
    const value = commerce(element ?? null);
    const pendingVariant = getVariantIntent();
    if (!pendingVariant || !value) return;
    const destination = new URL(pendingVariant.destination);
    if (destination.pathname !== location.pathname || selectionKey(destination.searchParams) !== selectionKey(new URLSearchParams(location.search))) return;
    const pending = pendingVariant; clearVariantIntent();
    const item = value.items[0];
    if (item.variant_id === pending.sourceVariantId) return;
    reportInteraction('variant_select', { interaction_id: pending.interactionId, product_id: item.product_id,
      variant_id: item.variant_id, item_id: item.item_id, item_variant: item.item_variant ?? item.variant_id,
      availability: item.available_for_sale ? 'available' : 'unavailable' });
  }
  function syncFormContext(form: HTMLFormElement) {
    const context = captureFormTrackingContext(); if (!context) return;
    let field = form.querySelector<HTMLInputElement>('input[name="leadTrackingContext"]');
    if (!field) { field = document.createElement('input'); field.type = 'hidden'; field.name = 'leadTrackingContext'; form.append(field); }
    field.value = JSON.stringify(context);
  }
  function scan(root: ParentNode, force = false) {
    if (root instanceof Element) watch(root, force);
    root.querySelectorAll(selector).forEach(element => watch(element, force));
    const sectionNodes = [...root.querySelectorAll('[data-journey-section]')];
    if (root instanceof Element && root.hasAttribute('data-journey-section')) sectionNodes.push(root);
    for (const element of sectionNodes) {
      if (sections.has(element) && !force) continue;
      if (sections.has(element)) sectionObserver.unobserve(element);
      sections.add(element); sectionObserver.observe(element);
    }
    for (const element of sections) if (!element.isConnected) {
      sectionObserver.unobserve(element); sections.delete(element);
      const timer = sectionTimers.get(element); if (timer) clearTimeout(timer); sectionTimers.delete(element);
    }
    const forms = [...root.querySelectorAll<HTMLFormElement>('form[data-tracking-form]')];
    if (root instanceof HTMLFormElement && root.hasAttribute('data-tracking-form')) forms.push(root);
    for (const form of forms) syncFormContext(form);
    commitVariant();
    if (location.pathname === '/handlehjelp/storrelsesguide' && document.querySelector('main h1') && claimObservation('size-guide-page')) {
      reportInteraction('size_guide_view', { guide_id: 'storrelsesguide', open_sequence: 1 });
    }
  }
  const mutations = new MutationObserver(records => {
    for (const record of records) {
      if (record.type === 'childList') record.addedNodes.forEach(node => { if (node instanceof Element) toScan.add(node); });
      else if (record.target instanceof Element && record.attributeName !== 'aria-expanded') toScan.add(record.target);
    }
    if (toScan.size && !frame) frame = requestAnimationFrame(() => { frame = 0; for (const node of toScan) scan(node, true); toScan.clear(); });
    for (const record of records) {
      const element = record.target;
      if (record.type !== 'attributes' || record.attributeName !== 'aria-expanded' || !(element instanceof Element)
        || element.getAttribute('aria-expanded') !== 'true') continue;
      if (element.matches('[data-slot="dialog-trigger"]') && element.closest('[data-tracking-size-guide]') && currentProduct()) {
        const sequence = (openCounts.get(element) ?? 0) + 1; openCounts.set(element, sequence);
        reportInteraction('size_guide_view', { guide_id: 'product-size-guide', open_sequence: sequence });
      }
      if (!element.matches('[data-slot="accordion-trigger"]')) continue;
      const value = currentProduct();
      if (!value) continue;
      const item = element.closest('[data-slot="accordion-item"]');
      const id = item?.id || element.getAttribute('aria-controls');
      if (!id) continue;
      const sequence = (openCounts.get(element) ?? 0) + 1; openCounts.set(element, sequence);
      reportInteraction('interact_with_accordion', { ...value, accordion_id: id,
        accordion_title: element.textContent?.trim() || id, interaction_sequence: sequence, interaction_type: 'open' });
      if (item?.hasAttribute('data-tracking-size-guide')) reportInteraction('size_guide_view', { guide_id: 'product-size-guide', open_sequence: sequence });
    }
  });
  const click = (event: MouseEvent) => {
    if (!(event.target instanceof Element)) return;
    if (event.defaultPrevented) return;
    const action = event.target.closest<HTMLElement>('[data-tracking-cta]');
    if (action && !(action instanceof HTMLButtonElement && action.disabled)) {
      const destination = action.getAttribute('data-tracking-destination') ?? (action instanceof HTMLAnchorElement ? new URL(action.href).pathname : location.pathname);
      reportInteraction('hero_interact', { cta_id: action.getAttribute('data-tracking-cta'), destination_path: destination, click_sequence: ++clickSequence });
    }
    const link = event.target.closest<HTMLAnchorElement>('a[href]');
    if (!link || event.defaultPrevented) return;
    if (new URL(link.href).origin === location.origin) recordJourney('internal_link_click', { link_id: `link:${sanitizeJourneyPath(new URL(link.href).pathname)}`, target_path: sanitizeJourneyPath(new URL(link.href).pathname), navigation_type: event.ctrlKey || event.metaKey || link.target === '_blank' ? 'new_tab' : new URL(link.href).pathname === location.pathname ? 'same_page' : 'same_tab' });
    const selected = link.closest('[data-tracking-commerce]');
    const value = commerce(selected);
    if (value && onCurrentRoute(selected!) && !selected?.hasAttribute('data-tracking-product') && new URL(link.href).pathname.startsWith('/produkter/')) {
      reportInteraction('select_item', { ...value, interaction_id: crypto.randomUUID(), item_list_id: list(selected!).id, destination_url: link.href });
    }
    const promo = link.closest('[data-tracking-promotion]');
    if (promo && onCurrentRoute(promo)) reportInteraction('select_promotion', { ...promotion(promo), interaction_id: crypto.randomUUID() });
    const cta = link.getAttribute('data-tracking-hero-cta');
    if (cta) reportInteraction('hero_interact', { cta_id: cta, destination_path: new URL(link.href).pathname, click_sequence: ++clickSequence });
  };
  const sample = () => {
    const height = Math.max(1, document.documentElement.scrollHeight, document.body.scrollHeight);
    maxScrollY = Math.max(maxScrollY, Math.max(0, Math.round(scrollY)));
    maxScrollPercent = Math.max(maxScrollPercent, Math.min(100, Math.round((Math.max(0, scrollY) + innerHeight) / height * 100)));
  };
  const scroll = () => {
    sample();
    const height = document.documentElement.scrollHeight;
    if (height <= window.innerHeight || window.scrollY <= 0) return;
    const percent = Math.min(100, Math.round((scrollY + innerHeight) / height * 100));
    for (const threshold of [25, 50, 75, 90]) if (percent >= threshold && claimObservation(`scroll:${threshold}`)) {
      reportInteraction('scroll_depth', { threshold, percent_scrolled: percent, document_height: Math.round(height) });
    }
  };
  const video = (event: Event) => {
    const element = event.target;
    if (!(element instanceof HTMLVideoElement) || !Number.isFinite(element.duration) || element.duration <= 0) return;
    const videoId = element.getAttribute('data-tracking-video') ?? new URL(element.currentSrc || location.href).pathname;
    const percent = Math.min(100, Math.floor(element.currentTime / element.duration * 100));
    const sent = videoMilestones.get(element) ?? new Set<number>(); videoMilestones.set(element, sent);
    for (const milestone of [10,25,50,75,90,100]) if (percent >= milestone && !sent.has(milestone)) {
      sent.add(milestone);
      if (claimObservation(`video:${videoId}:${milestone}`)) reportInteraction('video_progress', {
        video_id: videoId, video_title: element.getAttribute('aria-label') ?? document.title,
        milestone, video_duration: element.duration, video_current_time: element.currentTime, video_percent: percent,
      });
    }
  };
  const input = (event: Event) => {
    if (!(event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement)) return;
    if (!event.target.value.trim() || event.target.getAttribute('name') === 'website') return;
    if (event.target instanceof HTMLInputElement && event.target.type === 'checkbox' && !event.target.checked) return;
    const form = event.target.closest('form[data-tracking-form]');
    const id = form?.getAttribute('data-tracking-form');
    if (id && claimObservation(`form-start:${id}`)) reportInteraction('form_start', { form_id: id, form_name: form?.getAttribute('data-tracking-form-name') ?? id, field_category: event.target instanceof HTMLTextAreaElement ? 'message' : event.target.getAttribute('type') === 'checkbox' ? 'preference' : 'contact' });
  };
  const progress = (reason: 'hidden' | 'pagehide' | 'navigation') => {
    const data = { max_scroll_y: maxScrollY, max_scroll_percent: maxScrollPercent,
      document_height: Math.max(1, document.documentElement.scrollHeight), viewport_height: innerHeight,
      ...(lastVisibleSection ? { last_visible_section: lastVisibleSection } : {}) };
    const signature = JSON.stringify(data); if (signature === progressSignature) return;
    progressSignature = signature; recordJourney('journey_progress', { ...data, reason });
  };
  const pagehide = () => progress('pagehide');
  const submit = (event: Event) => { if (event.target instanceof HTMLFormElement && event.target.hasAttribute('data-tracking-form')) syncFormContext(event.target); };
  const invalidAttempts = new WeakMap<HTMLFormElement, number>();
  const invalid = (event: Event) => {
    if (!(event.target instanceof Element)) return;
    const form = event.target.closest<HTMLFormElement>('form[data-tracking-form]'); if (!form) return;
    const previous = invalidAttempts.get(form) ?? 0; if (Date.now() - previous < 100) return;
    invalidAttempts.set(form, Date.now());
    reportInteraction('form_error', { form_id: form.getAttribute('data-tracking-form'), attempt_id: crypto.randomUUID(), error_category: 'validation' });
  };
  const visibility = () => {
    if (document.visibilityState === 'hidden') progress('hidden');
    for (const timer of dwell.values()) clearTimeout(timer); dwell.clear();
    for (const timer of sectionTimers.values()) clearTimeout(timer); sectionTimers.clear();
    if (document.visibilityState === 'visible') { sample(); scan(document, true); }
  };
  document.addEventListener('visibilitychange', visibility);
  scan(document);
  sample();
  mutations.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['aria-expanded', 'data-tracking-commerce', 'data-tracking-selection', 'data-tracking-route', 'data-tracking-page'] });
  document.addEventListener('click', click, true);
  document.addEventListener('timeupdate', video, true);
  document.addEventListener('input', input);
  document.addEventListener('submit', submit, true); document.addEventListener('invalid', invalid, true); window.addEventListener('pagehide', pagehide);
  window.addEventListener('scroll', scroll, { passive: true });
  window.addEventListener('resize', sample, { passive: true });
  return () => { progress('navigation'); sectionObserver.disconnect(); for (const timer of sectionTimers.values()) clearTimeout(timer); window.removeEventListener('resize', sample);
    document.removeEventListener('visibilitychange', visibility); observer.disconnect(); mutations.disconnect(); if (frame) cancelAnimationFrame(frame);
    for (const timer of dwell.values()) clearTimeout(timer); for (const state of lists.values()) if (state.timer) clearTimeout(state.timer); document.removeEventListener('click', click, true);
    document.removeEventListener('timeupdate', video, true);
    document.removeEventListener('input', input); document.removeEventListener('submit', submit, true); document.removeEventListener('invalid', invalid, true); window.removeEventListener('pagehide', pagehide); window.removeEventListener('scroll', scroll); };
}

/** BFCache restores the mounted tree without replaying React's route effect. */
export function observeTrackedPage() {
  let stop = observeStorefront();
  const restore = (event: PageTransitionEvent) => {
    if (!event.persisted) return;
    stop(); reportNavigation(true); stop = observeStorefront();
  };
  window.addEventListener('pageshow', restore);
  return () => { window.removeEventListener('pageshow', restore); stop(); };
}
