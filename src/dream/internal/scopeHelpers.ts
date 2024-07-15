import uniq from '../../helpers/uniq'

export const DEFAULT_BYPASS_ALL_DEFAULT_SCOPES = false
export const DEFAULT_CASCADE = true
export const DEFAULT_DEFAULT_SCOPES_TO_BYPASS = []
export const DEFAULT_SKIP_HOOKS = false

export function addSoftDeleteScopeToUserScopes(userScopes: string[] | undefined) {
  return uniq([...(userScopes || []), 'dream:SoftDelete'])
}
