export interface HookStatement {
  className: string
  method: string
}

export function blankHooksFactory(): {
  beforeCreate: HookStatement[]
  beforeUpdate: HookStatement[]
  beforeSave: HookStatement[]
  beforeDestroy: HookStatement[]
  afterCreate: HookStatement[]
  afterUpdate: HookStatement[]
  afterSave: HookStatement[]
  afterDestroy: HookStatement[]
} {
  return {
    beforeCreate: [],
    beforeUpdate: [],
    beforeSave: [],
    beforeDestroy: [],
    afterCreate: [],
    afterUpdate: [],
    afterSave: [],
    afterDestroy: [],
  }
}
