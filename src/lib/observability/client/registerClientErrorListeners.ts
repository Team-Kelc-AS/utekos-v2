import { reportClientCaughtError } from './reportClientCaughtError'

export function registerClientErrorListeners(): () => void {
  const onError = (event: ErrorEvent) =>
    reportClientCaughtError(event.error ?? event.message, 'window', event)
  const onRejection = (event: PromiseRejectionEvent) =>
    reportClientCaughtError(event.reason, 'promise')
  window.addEventListener('error', onError)
  window.addEventListener('unhandledrejection', onRejection)
  return () => {
    window.removeEventListener('error', onError)
    window.removeEventListener('unhandledrejection', onRejection)
  }
}
