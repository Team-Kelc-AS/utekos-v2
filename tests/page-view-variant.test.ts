import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createPageViewSession,
  isVariantOnlyChange
} from '../src/lib/analytics/pageViewSession'

const base = 'https://utekos.no/produkter/utekos-techdown'

test('variant parameter changes on a product page are not a new page', () => {
  assert.equal(isVariantOnlyChange(`${base}?farge=havdyp&storrelse=stor`, `${base}?farge=havdyp&storrelse=middels`), true)
  assert.equal(isVariantOnlyChange(base, `${base}?storrelse=liten`), true)
  assert.equal(isVariantOnlyChange(`${base}?variant=1`, `${base}?variant=2&kjonn=unisex`), true)
})

test('other changes still start a new page view', () => {
  assert.equal(isVariantOnlyChange(base, base), false)
  assert.equal(isVariantOnlyChange(base, `${base}?fbclid=abc`), false)
  assert.equal(isVariantOnlyChange(`${base}?storrelse=stor`, `${base}?storrelse=liten&utm_source=fb`), false)
  assert.equal(isVariantOnlyChange(base, 'https://utekos.no/produkter/comfyrobe?storrelse=xs'), false)
  assert.equal(isVariantOnlyChange('https://utekos.no/produkter?farge=a', 'https://utekos.no/produkter?farge=b'), false)
})

test('a variant switch keeps the page view id and follows the URL', () => {
  let id = 0
  const session = createPageViewSession(() => `00000000-0000-4000-8000-00000000000${++id}`)
  const first = session.ensure({ pageUrl: `${base}?storrelse=stor` })
  session.recordEmitted(first)
  const switched = session.ensure({ pageUrl: `${base}?storrelse=middels` })
  assert.equal(switched.pageViewId, first.pageViewId)
  assert.equal(switched.pageUrl, `${base}?storrelse=middels`)
  assert.equal(session.hasEmitted(switched.pageViewId), true)
  const other = session.ensure({ pageUrl: 'https://utekos.no/produkter' })
  assert.notEqual(other.pageViewId, first.pageViewId)
  assert.equal(other.previousPageViewId, first.pageViewId)
})
