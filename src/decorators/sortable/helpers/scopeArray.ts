export default function scopeArray(scope?: string | string[]): string[] {
  if (!scope) return [] as string[]
  if (Array.isArray(scope)) return scope
  return [scope]
}
