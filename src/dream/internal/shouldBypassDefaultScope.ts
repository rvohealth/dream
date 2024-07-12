export default function shouldBypassDefaultScope(
  scopeName: string,
  {
    bypassAllDefaultScopes = false,
    defaultScopesToBypass,
  }: {
    bypassAllDefaultScopes?: boolean
    defaultScopesToBypass: string[]
  }
) {
  if (bypassAllDefaultScopes) return true
  if (!defaultScopesToBypass.length) return false
  if (defaultScopesToBypass.includes(scopeName)) return true
  return false
}
