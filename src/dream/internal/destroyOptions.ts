import Dream from '../../dream'
import { AllDefaultScopeNames } from '../types'
import {
  addSoftDeleteScopeToUserScopes,
  DEFAULT_BYPASS_ALL_DEFAULT_SCOPES,
  DEFAULT_CASCADE,
  DEFAULT_DEFAULT_SCOPES_TO_BYPASS,
  DEFAULT_SKIP_HOOKS,
} from './scopeHelpers'

export interface DestroyOptions<DreamInstance extends Dream> {
  bypassAllDefaultScopes?: boolean
  defaultScopesToBypass?: AllDefaultScopeNames<DreamInstance['dreamconf']>[]
  cascade?: boolean
  skipHooks?: boolean
}

function baseDestroyOptions<DreamInstance extends Dream>({
  bypassAllDefaultScopes,
  defaultScopesToBypass,
  cascade,
  skipHooks,
}: DestroyOptions<DreamInstance> = {}) {
  return {
    bypassAllDefaultScopes: bypassAllDefaultScopes ?? DEFAULT_BYPASS_ALL_DEFAULT_SCOPES,
    defaultScopesToBypass: defaultScopesToBypass ?? DEFAULT_DEFAULT_SCOPES_TO_BYPASS,
    cascade: cascade ?? DEFAULT_CASCADE,
    skipHooks: skipHooks ?? DEFAULT_SKIP_HOOKS,
  }
}

export function destroyOptions<DreamInstance extends Dream>(options: DestroyOptions<DreamInstance>) {
  return {
    ...baseDestroyOptions<DreamInstance>(options),
    reallyDestroy: false,
  }
}

export function undestroyOptions<DreamInstance extends Dream>(options: DestroyOptions<DreamInstance>) {
  return {
    ...baseDestroyOptions<DreamInstance>(options),
    defaultScopesToBypass: addSoftDeleteScopeToUserScopes<DreamInstance>(options?.defaultScopesToBypass),
  }
}

export function reallyDestroyOptions<DreamInstance extends Dream>(options: DestroyOptions<DreamInstance>) {
  return {
    ...undestroyOptions<DreamInstance>(options),
    reallyDestroy: true,
  }
}
