import { extractFbclidFromFbc } from './extractFbclidFromFbc'

const fbcPattern = /^fb\.\d+\.\d{13}\.[^;\s]+$/

/** Keep the first observed value of one genuine click across cookie scopes. */
export function selectMetaFbcCookie(
  values: readonly string[],
  observedFbclid?: string
): string | undefined {
  const candidates = [...new Set(values)].filter(value =>
    value.length <= 3800 &&
    encodeURIComponent(value).length <= 3800 &&
    fbcPattern.test(value) &&
    (!observedFbclid || extractFbclidFromFbc(value) === observedFbclid)
  )
  if (candidates.length === 0) return undefined

  const clicks = new Set(candidates.map(extractFbclidFromFbc))
  if (clicks.size !== 1 || clicks.has(undefined)) return undefined

  candidates.sort((left, right) =>
    Number(left.split('.')[2]) - Number(right.split('.')[2]) ||
    right.length - left.length ||
    left.localeCompare(right)
  )
  return candidates[0]
}
