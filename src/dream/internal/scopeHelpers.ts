import { SOFT_DELETE_SCOPE_NAME } from '../../decorators/soft-delete'
import Dream from '../../dream'
import uniq from '../../helpers/uniq'
import { AllDefaultScopeNames } from '../types'

export const DEFAULT_BYPASS_ALL_DEFAULT_SCOPES = false
export const DEFAULT_CASCADE = true
export const DEFAULT_DEFAULT_SCOPES_TO_BYPASS = []
export const DEFAULT_SKIP_HOOKS = false

export function addSoftDeleteScopeToUserScopes<DreamInstance extends Dream>(
  userScopes: AllDefaultScopeNames<DreamInstance['dreamconf']>[] = []
): AllDefaultScopeNames<DreamInstance['dreamconf']>[] {
  return uniq([...userScopes, SOFT_DELETE_SCOPE_NAME as AllDefaultScopeNames<DreamInstance['dreamconf']>])
}
