import { sanitizeClientErrorMessage } from './sanitizeClientErrorBeacon'
import { sanitizeClientErrorFilename, sanitizeClientErrorStack } from '../logging/sanitizeClientErrorDetails'
import { sendClientLog } from './sendClientLog'

export function reportClientCaughtError(
  error: unknown,
  operation: string,
  details?: { filename?: string; lineno?: number; colno?: number }
): void {
  if (typeof window === 'undefined') return

  const errorName = error instanceof Error ? error.name : 'OtherError'
  const errorMessage =
    error instanceof Error ? error.message : 'Caught client exception'
  const message = sanitizeClientErrorMessage(
    `${operation}: ${errorName}: ${errorMessage}`
  )

  if (process.env.NODE_ENV !== 'production') {
    console.error(`[client-operation] ${operation}`, error)
    return
  }

  void sendClientLog(
    {
      event: 'client_error',
      level: 'error',
      data: {
        source: 'window_error',
        operation: operation === 'window' || operation === 'promise' ? operation : 'caught',
        ...(error instanceof Error && error.stack ? { stack: sanitizeClientErrorStack(error.stack) } : {}),
        ...(details?.filename ? { filename: sanitizeClientErrorFilename(details.filename) } : {}),
        ...(validPosition(details?.lineno) ? { line: details?.lineno } : {}),
        ...(validPosition(details?.colno) ? { column: details?.colno } : {}),
        ...(message ? { message } : {})
      },
      context: { pathname: window.location.pathname }
    },
    {
      fetch,
      sendBeacon: navigator.sendBeacon?.bind(navigator)
    }
  ).catch(() => undefined)
}

function validPosition(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 10_000_000
}
