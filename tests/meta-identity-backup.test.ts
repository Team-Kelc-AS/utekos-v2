import test from 'node:test'
import assert from 'node:assert/strict'
import { NextRequest, NextResponse } from 'next/server'
import { captureProxyMetaCookies } from '../src/lib/analytics/server/captureProxyMetaCookies'
import { applyProxyMetaCookies } from '../src/lib/analytics/server/applyProxyMetaCookies'
import {
  META_IDENTITY_BACKUP_COOKIE,
  applyMetaIdentityBackupCookie,
  decodeMetaIdentityBackup,
  encodeMetaIdentityBackup
} from '../src/lib/analytics/server/metaIdentityBackupCookie'

const now = Date.now()
const fbp = 'fb.1.1795455686492.158371138.AQQCAQMC'
const fbclid = 'IwY2xjawVxW1Z-Case_Sensitive_aem_k19C'
const fbc = `fb.1.${now - 60_000}.${fbclid}.AQQCAQMC`

function documentRequest(url: string, cookie?: string) {
  return new NextRequest(url, {
    headers: {
      accept: 'text/html',
      'sec-fetch-dest': 'document',
      'sec-fetch-mode': 'navigate',
      ...(cookie ? { cookie } : {})
    }
  })
}

function run(url: string, cookie?: string) {
  const request = documentRequest(url, cookie)
  const metaCookies = captureProxyMetaCookies(request)
  const response = applyMetaIdentityBackupCookie(
    applyProxyMetaCookies(NextResponse.next(), request, metaCookies),
    request
  )
  return { request, response, metaCookies }
}

test('backup round-trips exact fbp and fbc values', () => {
  const encoded = encodeMetaIdentityBackup({ fbp, fbc })
  assert.ok(encoded)
  assert.deepEqual(decodeMetaIdentityBackup(encoded), { fbp, fbc })
  assert.deepEqual(decodeMetaIdentityBackup(encodeURIComponent(encoded!)), { fbp, fbc })
})

test('backup rejects malformed values', () => {
  assert.deepEqual(decodeMetaIdentityBackup('v2|x|y'), {})
  assert.deepEqual(decodeMetaIdentityBackup('v1|not-a-cookie|'), {})
  assert.equal(encodeMetaIdentityBackup({ fbp: 'bad', fbc: undefined }), undefined)
})

test('existing cookies are written to an HttpOnly backup on the document response', () => {
  const { response, metaCookies } = run('https://utekos.no/produkter', `_fbp=${fbp}; _fbc=${fbc}`)
  assert.equal(metaCookies.length, 0)
  const backup = response.cookies.get(META_IDENTITY_BACKUP_COOKIE)
  assert.ok(backup)
  assert.equal(backup.httpOnly, true)
  assert.equal(backup.maxAge, 60 * 60 * 24 * 90)
  assert.deepEqual(decodeMetaIdentityBackup(backup.value), { fbp, fbc })
})

test('expired script cookies are restored unchanged from the backup', () => {
  const backup = encodeMetaIdentityBackup({ fbp, fbc })!
  const { request, response, metaCookies } = run(
    'https://utekos.no/',
    `${META_IDENTITY_BACKUP_COOKIE}=${encodeURIComponent(backup)}`
  )
  assert.deepEqual(
    metaCookies.map(cookie => [cookie.name, cookie.value]).sort(),
    [['_fbc', fbc], ['_fbp', fbp]]
  )
  assert.equal(request.cookies.get('_fbc')?.value, fbc)
  assert.equal(request.cookies.get('_fbp')?.value, fbp)
  assert.equal(response.cookies.get('_fbc')?.value, fbc)
  const maxAge = response.cookies.get('_fbc')?.maxAge ?? 0
  assert.ok(maxAge > 60 * 60 * 24 * 90 - 120 && maxAge <= 60 * 60 * 24 * 90 - 60, String(maxAge))
  assert.equal(response.cookies.get('_fbp')?.value, fbp)
})

test('a new URL click is not replaced by the older backed-up fbc', () => {
  const backup = encodeMetaIdentityBackup({ fbp, fbc })!
  const newClick = 'NewClick_AbC123'
  const { request } = run(
    `https://utekos.no/?fbclid=${newClick}`,
    `${META_IDENTITY_BACKUP_COOKIE}=${encodeURIComponent(backup)}`
  )
  assert.equal(request.cookies.get('_fbp')?.value, fbp)
  const restoredFbc = request.cookies.get('_fbc')?.value ?? ''
  assert.match(restoredFbc, new RegExp(`^fb\\.1\\.\\d{13}\\.${newClick}(\\.[A-Za-z0-9_-]{8})?$`))
  assert.notEqual(restoredFbc, fbc)
})

test('the same URL click keeps the backed-up fbc and its creation time', () => {
  const backup = encodeMetaIdentityBackup({ fbp, fbc })!
  const { request } = run(
    `https://utekos.no/?fbclid=${fbclid}`,
    `${META_IDENTITY_BACKUP_COOKIE}=${encodeURIComponent(backup)}`
  )
  assert.equal(request.cookies.get('_fbc')?.value, fbc)
})

test('an fbc older than one cookie lifetime is neither backed up nor restored', () => {
  const old = `fb.1.${now - 174 * 24 * 60 * 60 * 1000}.OldClick`
  assert.deepEqual(decodeMetaIdentityBackup(encodeMetaIdentityBackup({ fbp, fbc: old })), { fbp })
  assert.deepEqual(decodeMetaIdentityBackup(`v1|${fbp}|${old}`), { fbp })
})

test('a restored fbc keeps only its remaining lifetime', () => {
  const tenDays = `fb.1.${now - 80 * 24 * 60 * 60 * 1000}.TenDaysLeft`
  const backup = encodeMetaIdentityBackup({ fbp, fbc: tenDays })!
  const { response } = run('https://utekos.no/', `${META_IDENTITY_BACKUP_COOKIE}=${encodeURIComponent(backup)}`)
  const maxAge = response.cookies.get('_fbc')?.maxAge ?? 0
  assert.ok(maxAge > 9 * 24 * 60 * 60 && maxAge <= 10 * 24 * 60 * 60, String(maxAge))
})

test('preview writes a host-only backup and production a domain-wide one', () => {
  const production = run('https://utekos.no/', `_fbp=${fbp}`).response.cookies.get(META_IDENTITY_BACKUP_COOKIE)
  const preview = run('https://preview.utekos.no/', `_fbp=${fbp}`).response.cookies.get(META_IDENTITY_BACKUP_COOKIE)
  assert.equal(production?.domain, 'utekos.no')
  assert.equal(preview?.domain, undefined)
})
