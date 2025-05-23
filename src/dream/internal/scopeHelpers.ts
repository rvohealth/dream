import { SOFT_DELETE_SCOPE_NAME } from '../../decorators/class/SoftDelete.js'
import Dream from '../../Dream.js'
import uniq from '../../helpers/uniq.js'
import { AllDefaultScopeNames } from '../../types/dream.js'

export const DEFAULT_BYPASS_ALL_DEFAULT_SCOPES = false
export const DEFAULT_CASCADE = true
export const DEFAULT_DEFAULT_SCOPES_TO_BYPASS = []
export const DEFAULT_SKIP_HOOKS = false

export function addSoftDeleteScopeToUserScopes<DreamInstance extends Dream>(
  userScopes: AllDefaultScopeNames<DreamInstance>[] = []
): AllDefaultScopeNames<DreamInstance>[] {
  return uniq([...userScopes, SOFT_DELETE_SCOPE_NAME as AllDefaultScopeNames<DreamInstance>])
}
