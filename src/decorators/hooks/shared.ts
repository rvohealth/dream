import Dream from '../../dream'

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
}

export interface BeforeHookOpts {
  ifChanging?: string[]
}

export function blankHooksFactory(dreamClass: typeof Dream): {
  beforeCreate: HookStatement[]
  beforeUpdate: HookStatement[]
  beforeSave: HookStatement[]
  beforeDestroy: HookStatement[]
  afterCreate: HookStatement[]
  afterCreateCommit: HookStatement[]
  afterUpdate: HookStatement[]
  afterUpdateCommit: HookStatement[]
  afterSave: HookStatement[]
  afterSaveCommit: HookStatement[]
  afterDestroy: HookStatement[]
  afterDestroyCommit: HookStatement[]
} {
  return {
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
}
