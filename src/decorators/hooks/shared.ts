import Dream from '../../Dream.js.js'
import { DreamColumnNames } from '../../dream/types.js.js'
import freezeBaseClassArrayMap from '../helpers/freezeBaseClassArrayMap.js.js'

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
  ifChanging?: string[]
  ifChanged?: string[]
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

export function blankHooksFactory(
  dreamClass: typeof Dream,
  {
    freeze = false,
  }: {
    freeze?: boolean
  } = {}
): HookStatementMap {
  const hooksMap = {
    beforeCreate: [...(dreamClass['hooks']?.beforeCreate || [])],
    beforeUpdate: [...(dreamClass['hooks']?.beforeUpdate || [])],
    beforeSave: [...(dreamClass['hooks']?.beforeSave || [])],
    beforeDestroy: [...(dreamClass['hooks']?.beforeDestroy || [])],
    afterCreate: [...(dreamClass['hooks']?.afterCreate || [])],
    afterCreateCommit: [...(dreamClass['hooks']?.afterCreateCommit || [])],
    afterUpdate: [...(dreamClass['hooks']?.afterUpdate || [])],
    afterUpdateCommit: [...(dreamClass['hooks']?.afterUpdateCommit || [])],
    afterSave: [...(dreamClass['hooks']?.afterSave || [])],
    afterSaveCommit: [...(dreamClass['hooks']?.afterSaveCommit || [])],
    afterDestroy: [...(dreamClass['hooks']?.afterDestroy || [])],
    afterDestroyCommit: [...(dreamClass['hooks']?.afterDestroyCommit || [])],
  }

  if (freeze) return freezeBaseClassArrayMap(hooksMap)
  return hooksMap
}
