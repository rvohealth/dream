import { softDeleteScopeAlias, softDeleteScopeName } from '../../decorators/soft-delete'

export default function shouldBypassDefaultScope(scopeName: string, defaultScopesToBypass: string[] = []) {
  if (!defaultScopesToBypass.length) return false
  if (defaultScopesToBypass.includes(scopeName)) return true
  if (scopeName === softDeleteScopeName && defaultScopesToBypass.includes(softDeleteScopeAlias)) return true
  return false
}
