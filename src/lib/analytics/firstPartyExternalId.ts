import type { ConsentSnapshot } from './pageViewEvent'

export const FIRST_PARTY_EXTERNAL_ID_COOKIE =
  'utekos_external_id'

const EXTERNAL_ID_MAX_AGE_SECONDS = 60 * 60 * 24 * 365
const ANONYMOUS_EXTERNAL_ID_PATTERN =
  /^anon_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type FirstPartyExternalIdDependencies = {
  createId: () => string
  getCookieHeader: () => string
  isSecureContext: () => boolean
  setCookie: (cookie: string) => void
}

function readCookie(
  cookieHeader: string,
  name: string
): string | undefined {
  const prefix = `${name}=`

  for (const part of cookieHeader.split(';')) {
    const candidate = part.trim()
    if (!candidate.startsWith(prefix)) continue

    const value = candidate.slice(prefix.length)
    if (!value) return undefined

    try {
      return decodeURIComponent(value)
    } catch {
      return undefined
    }
  }

  return undefined
}

function serializeCookie(
  value: string,
  maxAge: number,
  secure: boolean
) {
  return [
    `${FIRST_PARTY_EXTERNAL_ID_COOKIE}=${encodeURIComponent(value)}`,
    'Path=/',
    `Max-Age=${maxAge}`,
    'SameSite=Lax',
    ...(secure ? ['Secure'] : [])
  ].join('; ')
}

export function createFirstPartyExternalIdStore(
  dependencies: FirstPartyExternalIdDependencies
) {
  function clear() {
    dependencies.setCookie(
      serializeCookie('', 0, dependencies.isSecureContext())
    )
  }

  function getOrCreate(
    consent: ConsentSnapshot
  ): string | undefined {
    if (consent.marketing !== 'granted') return undefined

    const existing = readCookie(
      dependencies.getCookieHeader(),
      FIRST_PARTY_EXTERNAL_ID_COOKIE
    )

    if (
      existing &&
      ANONYMOUS_EXTERNAL_ID_PATTERN.test(existing)
    ) {
      return existing
    }

    const externalId = `anon_${dependencies.createId()}`

    if (!ANONYMOUS_EXTERNAL_ID_PATTERN.test(externalId)) {
      throw new Error('Failed to create a valid external ID')
    }

    dependencies.setCookie(
      serializeCookie(
        externalId,
        EXTERNAL_ID_MAX_AGE_SECONDS,
        dependencies.isSecureContext()
      )
    )

    return externalId
  }

  return { clear, getOrCreate }
}

export const browserFirstPartyExternalIdStore =
  createFirstPartyExternalIdStore({
    createId: () => globalThis.crypto.randomUUID(),
    getCookieHeader: () => document.cookie,
    isSecureContext: () => window.location.protocol === 'https:',
    setCookie: cookie => {
      document.cookie = cookie
    }
  })
