export default function isEmpty(
  value: unknown[] | Record<string, unknown> | Set<unknown> | Map<unknown, unknown>
): boolean {
  if (Array.isArray(value)) return value.length === 0
  if (value instanceof Map || value instanceof Set) return value.size === 0
  return Object.keys(value).length === 0
}
