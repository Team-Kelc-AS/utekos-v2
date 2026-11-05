const windows = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;

// Bounded instance-local protection; Gateway budgets remain the shared spend limit.
export function summaryRateLimit(key: string, now = Date.now()): number {
  for (const [key, window] of windows) {
    if (window.resetAt <= now) windows.delete(key);
  }
  const window = windows.get(key);
  if (window && window.count >= 10) return Math.ceil((window.resetAt - now) / 1000);
  if (window) window.count += 1;
  else {
    if (windows.size >= 1000) return 60;
    windows.set(key, { count: 1, resetAt: now + WINDOW_MS });
  }
  return 0;
}
