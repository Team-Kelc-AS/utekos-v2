// The backend durably accepts the event, then awaits a Meta dispatch whose
// HTTP deadline is 10 seconds. Allow storage/transport overhead before the
// bridge gives up, and give the browser time to receive that bridge result.
// These are bounded application budgets, not provider delivery guarantees.
export const CANONICAL_EVENT_BRIDGE_TIMEOUT_MS = 20_000;
export const CANONICAL_EVENT_BROWSER_TIMEOUT_MS = 25_000;
