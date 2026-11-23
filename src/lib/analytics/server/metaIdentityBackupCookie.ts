import type { NextRequest, NextResponse } from 'next/server'

/**
 * Server-set, HttpOnly backup of the Meta browser identifiers.
 *
 * Meta's own fbevents.js rewrites `_fbp`/`_fbc` through `document.cookie` on
 * every Pixel event. Safari ITP caps such script-written cookies to 7 days
 * (24 hours after a decorated link). This cookie is only ever written in an
 * HTTP response, is not readable by scripts and therefore keeps its full
 * lifetime. The proxy restores `_fbp`/`_fbc` from it when Safari has deleted
 * them, without minting a new identity or changing an fbc creation time.
 */
export const META_IDENTITY_BACKUP_COOKIE = 'utekos_meta_ids'
export const META_IDENTITY_BACKUP_MAX_AGE_SECONDS = 60 * 60 * 24 * 90

const META_COOKIE_PATTERN = /^fb\.\d+\.\d{13}\.[^;\s|]+$/
const MAX_VALUE_LENGTH = 3800

export type MetaIdentityBackup = {
  fbp?: string | undefined
  fbc?: string | undefined
}

function validMetaValue(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length <= 1500 &&
    META_COOKIE_PATTERN.test(value)
  )
}

/**
 * Seconds an fbc may still live: one cookie lifetime from its creation time.
 * A backup must never extend an old click beyond that window.
 */
export function remainingFbcSeconds(fbc: string, nowMs = Date.now()): number {
  const createdAt = Number(fbc.split('.')[2])
  if (!Number.isSafeInteger(createdAt)) return 0
  return Math.max(
    0,
    Math.min(
      META_IDENTITY_BACKUP_MAX_AGE_SECONDS,
      Math.floor((createdAt + META_IDENTITY_BACKUP_MAX_AGE_SECONDS * 1000 - nowMs) / 1000)
    )
  )
}

function validFbc(value: unknown, nowMs: number): value is string {
  return validMetaValue(value) && remainingFbcSeconds(value, nowMs) > 0
}

export function encodeMetaIdentityBackup(
  backup: MetaIdentityBackup,
  nowMs = Date.now()
): string | undefined {
  const fbp = validMetaValue(backup.fbp) ? backup.fbp : ''
  const fbc = validFbc(backup.fbc, nowMs) ? backup.fbc : ''
  if (!fbp && !fbc) return undefined
  const value = `v1|${fbp}|${fbc}`
  return encodeURIComponent(value).length <= MAX_VALUE_LENGTH ?
      value
    : undefined
}

export function decodeMetaIdentityBackup(
  value: string | undefined | null,
  nowMs = Date.now()
): MetaIdentityBackup {
  if (!value) return {}
  let decoded = value
  try {
    decoded = decodeURIComponent(value)
  } catch {
    return {}
  }
  const [version, fbp, fbc, ...rest] = decoded.split('|')
  if (version !== 'v1' || rest.length > 0) return {}
  return {
    ...(validMetaValue(fbp) ? { fbp } : {}),
    ...(validFbc(fbc, nowMs) ? { fbc } : {})
  }
}

function cookieDomainForHost(hostname: string): string | undefined {
  // Preview stays host-only so it can never write a production-wide cookie.
  return hostname !== 'preview.utekos.no' &&
      (hostname === 'utekos.no' || hostname.endsWith('.utekos.no')) ?
      'utekos.no'
    : undefined
}

/**
 * Writes the backup from the identifiers the proxy resolved for this request.
 * Refreshes the lifetime on every document response (sliding 90 days).
 */
export function applyMetaIdentityBackupCookie(
  response: NextResponse,
  request: NextRequest
): NextResponse {
  const value = encodeMetaIdentityBackup({
    fbp: request.cookies.get('_fbp')?.value,
    fbc: request.cookies.get('_fbc')?.value
  })
  if (!value) return response
  const domain = cookieDomainForHost(request.nextUrl.hostname)
  response.cookies.set(META_IDENTITY_BACKUP_COOKIE, value, {
    ...(domain ? { domain } : {}),
    httpOnly: true,
    maxAge: META_IDENTITY_BACKUP_MAX_AGE_SECONDS,
    path: '/',
    sameSite: 'lax',
    secure: request.nextUrl.protocol === 'https:'
  })
  return response
}
