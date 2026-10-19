const regions = [
  '[data-gallery-product]', '[data-journey-section="purchase"]',
  '[data-journey-section="reviews"]', '[data-tracking-list]',
  'header', 'footer', 'main',
] as const;

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function rect(value: unknown) {
  if (!record(value)) return undefined;
  const { x, y, width, height } = value;
  if (![x, y, width, height].every(n => typeof n === 'number' && Number.isFinite(n))) return undefined;
  return { x, y, width, height };
}

// Never serialize DOM nodes, text, input values, URLs, IDs or arbitrary attributes.
export function summarizeVitalEntries(entries: readonly PerformanceEntry[]) {
  return entries.slice(-10).map(entry => {
    const sources = 'sources' in entry && Array.isArray(entry.sources) ? entry.sources : [];
    return {
      entry_type: entry.entryType,
      start_time: entry.startTime,
      duration: entry.duration,
      ...('value' in entry && typeof entry.value === 'number' ? { value: entry.value } : {}),
      ...('hadRecentInput' in entry ? { had_recent_input: entry.hadRecentInput === true } : {}),
      sources: sources.slice(0, 5).filter(record).map(source => {
        const node = typeof Element !== 'undefined' && source.node instanceof Element ? source.node : null;
        return {
          tag: node?.tagName.toLowerCase(),
          region: node ? regions.find(selector => node.closest(selector)) : undefined,
          previous_rect: rect(source.previousRect),
          current_rect: rect(source.currentRect),
        };
      }),
    };
  });
}

export function vitalDocumentPath(navigationUrl: string | undefined, currentUrl: string) {
  const current = new URL(currentUrl);
  if (!navigationUrl) return current.pathname;
  const navigation = new URL(navigationUrl, current);
  return navigation.origin === current.origin ? navigation.pathname : current.pathname;
}
