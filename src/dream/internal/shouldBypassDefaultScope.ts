export default function shouldBypassDefaultScope(scopeName: string, defaultScopesToBypass: string[] = []) {
  if (!defaultScopesToBypass.length) return false
  if (defaultScopesToBypass.includes(scopeName)) return true
  return false
}
