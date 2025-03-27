import Dream from '../../Dream.js'
import { AllDefaultScopeNames } from '../../types/dream.js'
import {
  addSoftDeleteScopeToUserScopes,
  DEFAULT_BYPASS_ALL_DEFAULT_SCOPES,
  DEFAULT_CASCADE,
  DEFAULT_DEFAULT_SCOPES_TO_BYPASS,
  DEFAULT_SKIP_HOOKS,
} from './scopeHelpers.js'

/**
 * Options for destroying a Dream instance or its associations.
 */
export interface DestroyOptions<DreamInstance extends Dream> {
  /**
   * If true, bypasses all default scopes when destroying the instance.
   * Defaults to false.
   */
  bypassAllDefaultScopes?: boolean | undefined

  /**
   * An array of default scope names to bypass when destroying the instance.
   * Defaults to an empty array.
   */
  defaultScopesToBypass?: AllDefaultScopeNames<DreamInstance>[] | undefined

  /**
   * If false, skips destroying associations marked `dependent: 'destroy'`. Defaults to true.
   */
  cascade?: boolean | undefined

  /**
   * If true, skips applying model hooks during the destroy operation.
   * Defaults to false.
   */
  skipHooks?: boolean | undefined
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
