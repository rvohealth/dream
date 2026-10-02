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

/**
 * The decorator returned by `deco.AfterCreateCommit()`,
 * `deco.AfterSaveCommit()`, `deco.AfterUpdateCommit()` and
 * `deco.AfterDestroyCommit()`.
 *
 * Dream calls every commit hook with no argument: by the time it runs, the
 * transaction has already committed, so there is no transaction to hand it.
 * Decorating an instance method that declares a parameter — required,
 * optional, defaulted or rest — is therefore a compile error.
 *
 * Other placements of the decorator (an arrow-function field, an `accessor`
 * field, a getter, a static method) are not checked.
 *
 * A subclass that overrides a decorated commit hook without decorating the
 * override is not checked either, so `override hook(txn?: ...)` compiles; at
 * runtime the override is still called with no argument.
 */
export interface CommitHookDecorator {
  <This, Method extends (...args: any[]) => unknown>(
    value: This extends abstract new (...args: any[]) => unknown ? Method : CommitHookMethod<Method>,
    context: ClassMethodDecoratorContext<This, Method>
  ): void
  (
    value: any,
    context:
      | ClassFieldDecoratorContext<any, any>
      | ClassGetterDecoratorContext<any, any>
      | ClassSetterDecoratorContext<any, any>
      | ClassAccessorDecoratorContext<any, any>
      | ClassDecoratorContext<any>
  ): void
}

/**
 * A method a commit-hook decorator accepts: one that declares no parameter.
 * Any other method resolves to a message naming the problem, which the
 * decorated method is not assignable to. The parameter tuple is compared
 * whole, so a rest parameter typed as a union such as `[] | [X]` is rejected
 * too.
 */
export type CommitHookMethod<Method> = Method extends (...args: infer Params) => unknown
  ? [Params] extends [[]]
    ? Method
    : 'a commit hook is called with no argument: remove its parameters'
  : never

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
