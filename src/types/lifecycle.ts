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
  ifChanging?: T extends Dream ? DreamColumnNames<T>[] : string[]
}

export interface AfterHookOpts<T extends Dream | null = null> {
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
