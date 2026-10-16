import { registerClientErrorListeners } from './lib/observability/client/registerClientErrorListeners'
import { isTrackingOrigin, productionTrackingEnabled } from './lib/tracking/environment'

// Next executes this synchronously before hydration. Registering in a lazy
// tracking component's effect misses errors from the initial hydration itself.
// Retain the existing production/origin/crawler gates.
if (productionTrackingEnabled() && isTrackingOrigin(window.location.href)) {
  registerClientErrorListeners()
}
