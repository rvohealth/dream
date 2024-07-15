import { SOFT_DELETE_SCOPE_NAME } from '../../decorators/soft-delete'
import uniq from '../../helpers/uniq'

export const DEFAULT_BYPASS_ALL_DEFAULT_SCOPES = false
export const DEFAULT_CASCADE = true
export const DEFAULT_DEFAULT_SCOPES_TO_BYPASS = []
export const DEFAULT_SKIP_HOOKS = false

export function addSoftDeleteScopeToUserScopes(userScopes: string[] = []) {
  return uniq([...userScopes, SOFT_DELETE_SCOPE_NAME])
}
