import * as z from '@/lib/validation/zodMini'
import { sanitizeClientErrorFilename, sanitizeClientErrorStack } from './sanitizeClientErrorDetails'
import { COLLECTOR_TARGETS, COLLECTOR_NATIVE_REASONS } from '../client/collectorFailureDiagnostics'

export const clientErrorDataSchema = z.strictObject({
  source: z.literal('window_error'),
  message: z.optional(
    z.string().check(
      z.minLength(1),
      z.maxLength(240),
      z.refine(value => !/\S+@\S+\.\S+/.test(value), {
        message:
          'Client error message must not contain email-like values'
      })
    )
  ),
  filename: z.optional(
    z.pipe(
      z.string().check(z.minLength(1), z.maxLength(512)),
      z.transform(sanitizeClientErrorFilename)
    )
  ),
  stack: z.optional(z.pipe(
    z.string().check(z.maxLength(6_000)),
    z.transform(sanitizeClientErrorStack)
  )),
  operation: z.optional(z.enum(['window', 'promise', 'caught'])),
  collector: z.optional(z.strictObject({
    target: z.enum(COLLECTOR_TARGETS),
    native_reason: z.enum(COLLECTOR_NATIVE_REASONS),
    body_bytes: z.int().check(z.gte(0)),
    canonical_in_flight_keepalive_bytes: z.int().check(z.gte(0)),
    keepalive: z.boolean(),
    attempts: z.literal(2),
    signal_aborted: z.boolean(),
    visibility: z.enum(['visible', 'hidden', 'unknown']),
    online: z.nullable(z.boolean())
  })),
  line: z.optional(z.int().check(z.gte(0), z.lte(10_000_000))),
  column: z.optional(z.int().check(z.gte(0), z.lte(10_000_000)))
})
