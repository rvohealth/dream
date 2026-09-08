import type Dream from '../../Dream.js'
import type { DestroyOptions } from './destroyOptions.js'

export interface InstanceMutationOptions {
  /**
   * @deprecated `lock` is a query-level option. Use `Model.where({ id }).destroy({ lock: true })`
   * or `Model.where({ id }).update(attributes, { lock: true })` instead.
   */
  lock?: never
}

export type InstanceDestroyOptions<DreamInstance extends Dream> = DestroyOptions<DreamInstance> &
  InstanceMutationOptions

export interface InstanceUpdateOptions extends InstanceMutationOptions {
  skipHooks?: boolean | undefined
}
