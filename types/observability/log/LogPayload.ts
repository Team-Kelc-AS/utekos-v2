import type { ConsentDiagnosticCode } from './ConsentDiagnosticCode'
import type { CollectorFailureDiagnostics } from '@/lib/observability/client/collectorFailureDiagnostics'

type ClientLogContext = { pathname: string }

export type LogPayload =
  | {
      event: 'consent_diagnostic'
      level: 'info'
      data: { code: ConsentDiagnosticCode }
      context: ClientLogContext
    }
  | {
      event: 'client_error'
      level: 'error'
      data: {
        source: 'window_error'
        message?: string
        stack?: string
        operation?: 'window' | 'promise' | 'caught'
        collector?: CollectorFailureDiagnostics
        filename?: string
        line?: number
        column?: number
      }
      context: ClientLogContext
    }
  | {
      event: 'client_unhandled_rejection'
      level: 'error'
      data: {
        source: 'unhandled_rejection'
        errorName?:
          | 'AbortError'
          | 'AggregateError'
          | 'DOMException'
          | 'Error'
          | 'EvalError'
          | 'OtherError'
          | 'RangeError'
          | 'ReferenceError'
          | 'SyntaxError'
          | 'TimeoutError'
          | 'TypeError'
          | 'URIError'
          | 'ZodError'
        reasonType:
          | 'bigint'
          | 'boolean'
          | 'function'
          | 'null'
          | 'number'
          | 'object'
          | 'string'
          | 'symbol'
          | 'undefined'
        reasonIsError: boolean
        message?: string
      }
      context: ClientLogContext
    }
