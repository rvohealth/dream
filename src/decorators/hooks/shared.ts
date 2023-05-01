export type HookType =
  | 'beforeCreate'
  | 'beforeSave'
  | 'beforeUpdate'
  | 'beforeDestroy'
  | 'afterCreate'
  | 'afterCreateCommit'
  | 'afterSave'
  | 'afterSaveCommit'
  | 'afterUpdate'
  | 'afterUpdateCommit'
  | 'afterDestroy'
  | 'afterDestroyCommit'
export interface HookStatement {
  type: HookType
  className: string
  method: string
}

export function blankHooksFactory(): {
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
    beforeCreate: [],
    beforeUpdate: [],
    beforeSave: [],
    beforeDestroy: [],
    afterCreate: [],
    afterCreateCommit: [],
    afterUpdate: [],
    afterUpdateCommit: [],
    afterSave: [],
    afterSaveCommit: [],
    afterDestroy: [],
    afterDestroyCommit: [],
  }
}
