import Dream from '../Dream.js'
import { DreamColumnNames } from './dream.js'

export type HookType =
  | 'beforeCreate'
  | 'beforeSave'
  | 'beforeUpdate'
  | 'beforeDestroy'
  | 'afterCreate'
  | 'afterSave'
  | 'afterUpdate'
  | 'afterDestroy'
  | CommitHookType

export type CommitHookType =
  | 'afterCreateCommit'
  | 'afterSaveCommit'
  | 'afterUpdateCommit'
  | 'afterDestroyCommit'

export interface HookStatement {
  type: HookType
  className: string
  method: string
  ifChanging?: string[] | undefined
  ifChanged?: string[] | undefined
}

export interface BeforeHookOpts<T extends Dream | null = null> {
  /**
   * Only run this hook if one of the specified columns is being changed in the
   * current save operation.
   *
   * ```ts
   * @deco.BeforeCreate({ ifChanging: ['email'] })
   * public normalizeEmail() { ... }
   * ```
   */
  ifChanging?: T extends Dream ? DreamColumnNames<T>[] : string[]
}

export interface AfterHookOpts<T extends Dream | null = null> {
  /**
   * Only run this hook if one of the specified columns was changed in the
   * most recent save operation.
   *
   * ```ts
   * @deco.AfterUpdate({ ifChanged: ['email'] })
   * public sendEmailVerification() { ... }
   * ```
   */
  ifChanged?: T extends Dream ? DreamColumnNames<T>[] : string[]
}

export interface HookStatementMap {
  beforeCreate: readonly HookStatement[] | HookStatement[]
  beforeUpdate: readonly HookStatement[] | HookStatement[]
  beforeSave: readonly HookStatement[] | HookStatement[]
  beforeDestroy: readonly HookStatement[] | HookStatement[]
  afterCreate: readonly HookStatement[] | HookStatement[]
  afterCreateCommit: readonly HookStatement[] | HookStatement[]
  afterUpdate: readonly HookStatement[] | HookStatement[]
  afterUpdateCommit: readonly HookStatement[] | HookStatement[]
  afterSave: readonly HookStatement[] | HookStatement[]
  afterSaveCommit: readonly HookStatement[] | HookStatement[]
  afterDestroy: readonly HookStatement[] | HookStatement[]
  afterDestroyCommit: readonly HookStatement[] | HookStatement[]
}
