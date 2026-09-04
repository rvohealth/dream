import { STI_SCOPE_NAME } from '../../decorators/class/STI.js'

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
  if (defaultScopesToBypass.includes(scopeName)) return true
  if (bypassAllDefaultScopes) return scopeName !== STI_SCOPE_NAME
  return false
}
