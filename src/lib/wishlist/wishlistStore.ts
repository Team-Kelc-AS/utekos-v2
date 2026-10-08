const WISHLIST_STORAGE_KEY = 'utekos_wishlist_v1'

export type WishlistEntry = {
  addedAt: string
  mutationId: string
  productHandle?: string
  productId: string
  variantId: string
}

export type WishlistState = {
  entries: WishlistEntry[]
  updatedAt: string
}

export type StorageLike = {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export type AddWishlistItemInput = {
  now?: () => string
  productHandle?: string
  productId: string
  randomId?: () => string
  storage?: StorageLike
  variantId: string
}

export type AddWishlistItemResult =
  | {
      added: false
      entry: WishlistEntry
      mutationId: string
    }
  | {
      added: true
      entry: WishlistEntry
      mutationId: string
    }

function getDefaultStorage(): StorageLike | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    return window.localStorage
  } catch {
    return undefined
  }
}

function isWishlistEntry(value: unknown): value is WishlistEntry {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false
  }

  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.productId === 'string' &&
    candidate.productId.length > 0 &&
    typeof candidate.variantId === 'string' &&
    candidate.variantId.length > 0 &&
    typeof candidate.addedAt === 'string' &&
    candidate.addedAt.length > 0 &&
    typeof candidate.mutationId === 'string' &&
    candidate.mutationId.length > 0 &&
    (candidate.productHandle === undefined ||
      typeof candidate.productHandle === 'string')
  )
}

function sanitizeWishlistState(parsed: unknown): WishlistState {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { entries: [], updatedAt: '' }
  }

  const candidate = parsed as Record<string, unknown>
  const entries = Array.isArray(candidate.entries) ?
      candidate.entries.filter(isWishlistEntry)
    : []

  return {
    entries,
    updatedAt:
      typeof candidate.updatedAt === 'string' ? candidate.updatedAt : ''
  }
}

export function readWishlistState(
  storage: StorageLike | undefined = getDefaultStorage()
): WishlistState {
  if (!storage) return { entries: [], updatedAt: '' }

  try {
    const raw = storage.getItem(WISHLIST_STORAGE_KEY)
    if (!raw) return { entries: [], updatedAt: '' }
    return sanitizeWishlistState(JSON.parse(raw))
  } catch {
    return { entries: [], updatedAt: '' }
  }
}

function writeWishlistState(
  state: WishlistState,
  storage: StorageLike | undefined
): boolean {
  if (!storage) return false

  try {
    storage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}

export function hasWishlistVariant(
  variantId: string,
  storage: StorageLike | undefined = getDefaultStorage()
): boolean {
  return readWishlistState(storage).entries.some(
    entry => entry.variantId === variantId
  )
}

/**
 * Persist a wishlist item. Returns added:true only when a new mutation was
 * written. Re-adding an existing variant is a no-op (no new mutation_id).
 */
export function addWishlistItem(
  input: AddWishlistItemInput
): AddWishlistItemResult | null {
  const storage = input.storage ?? getDefaultStorage()
  if (!storage) return null

  const existing = readWishlistState(storage).entries.find(
    entry => entry.variantId === input.variantId
  )
  if (existing) {
    return {
      added: false,
      entry: existing,
      mutationId: existing.mutationId
    }
  }

  const now = (input.now ?? (() => new Date().toISOString()))()
  const mutationId = (input.randomId ?? (() => globalThis.crypto.randomUUID()))()
  const entry: WishlistEntry = {
    productId: input.productId,
    variantId: input.variantId,
    ...(input.productHandle ? { productHandle: input.productHandle } : {}),
    addedAt: now,
    mutationId
  }

  const nextState: WishlistState = {
    entries: [...readWishlistState(storage).entries, entry],
    updatedAt: now
  }

  if (!writeWishlistState(nextState, storage)) return null

  return {
    added: true,
    entry,
    mutationId
  }
}

export { WISHLIST_STORAGE_KEY }
