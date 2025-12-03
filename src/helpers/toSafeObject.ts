/**
 * @internal
 *
 * Returns a shallow copy of the object using a prototype-less container
 * (Object.create(null)). Use when assigning untrusted keys so that keys like
 * __proto__ or constructor cannot pollute Object.prototype.
 */
export function toSafeObject<T extends object>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj

  const safe = Object.create(null) as T

  for (const key of Object.keys(obj as object)) {
    ;(safe as Record<string, unknown>)[key] = (obj as Record<string, unknown>)[key]
  }

  return safe
}
