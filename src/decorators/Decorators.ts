import Dream from '../Dream.js'
import {
  NonPolymorphicBelongsToOptions,
  PolymorphicBelongsToOptions,
} from '../types/associations/belongsTo.js'
import {
  HasManyOptions,
  HasManyThroughOptions,
  PolymorphicHasManyOptions,
} from '../types/associations/hasMany.js'
import {
  HasOneOptions,
  HasOneThroughOptions,
  PolymorphicHasOneOptions,
} from '../types/associations/hasOne.js'
import { DreamColumnNames, GlobalModelNameTableMap, SortableOptions } from '../types/dream.js'
import { AfterHookOpts, BeforeHookOpts } from '../types/lifecycle.js'
import { OpenapiSchemaBodyShorthand, OpenapiShorthandPrimitiveTypes } from '../types/openapi.js'
import { ValidationType } from '../types/validation.js'
import Virtual from './field-or-getter/Virtual.js'
import Encrypted from './field/Encrypted.js'
import BelongsTo from './field/association/BelongsTo.js'
import HasMany from './field/association/HasMany.js'
import HasOne from './field/association/HasOne.js'
import AfterCreate from './field/lifecycle/AfterCreate.js'
import AfterCreateCommit from './field/lifecycle/AfterCreateCommit.js'
import AfterDestroy from './field/lifecycle/AfterDestroy.js'
import AfterDestroyCommit from './field/lifecycle/AfterDestroyCommit.js'
import AfterSave from './field/lifecycle/AfterSave.js'
import AfterSaveCommit from './field/lifecycle/AfterSaveCommit.js'
import AfterUpdate from './field/lifecycle/AfterUpdate.js'
import AfterUpdateCommit from './field/lifecycle/AfterUpdateCommit.js'
import BeforeCreate from './field/lifecycle/BeforeCreate.js'
import BeforeDestroy from './field/lifecycle/BeforeDestroy.js'
import BeforeSave from './field/lifecycle/BeforeSave.js'
import BeforeUpdate from './field/lifecycle/BeforeUpdate.js'
import Sortable from './field/sortable/Sortable.js'
import Validates from './field/validation/Validates.js'
import Validate from './method/Validate.js'
import Scope from './static-method/Scope.js'

export default class Decorators<TD extends typeof Dream, T extends Dream = InstanceType<TD>> {
  public BelongsTo<
    const AssociationGlobalNameOrNames extends
      | keyof GlobalModelNameTableMap<T>
      | (keyof GlobalModelNameTableMap<T>)[],
  >(
    this: Decorators<TD>,
    globalAssociationNameOrNames: AssociationGlobalNameOrNames,
    options?: NonPolymorphicBelongsToOptions<T, AssociationGlobalNameOrNames>
  ): any

  public BelongsTo<
    const AssociationGlobalNameOrNames extends
      | keyof GlobalModelNameTableMap<T>
      | (keyof GlobalModelNameTableMap<T>)[],
  >(
    this: Decorators<TD>,
    globalAssociationNameOrNames: AssociationGlobalNameOrNames,
    options?: PolymorphicBelongsToOptions<T, AssociationGlobalNameOrNames>
  ): any

  /**
   * Establishes a "BelongsTo" association between the base dream
   * and the child dream, where the base dream has a foreign key
   * which points back to the child dream.
   *
   * ```ts
   * class UserSettings extends ApplicationModel {
   *   @deco.BelongsTo('User')
   *   public user: User
   *   public userId: DreamColumn<UserSettings, 'userId'>
   * }
   *
   * class User extends ApplicationModel {
   *   @deco.HasOne('UserSettings')
   *   public userSettings: UserSettings
   * }
   * ```
   *
   *
   *
   * @param modelCB - a function that immediately returns the dream class you are associating with this dream class
   * @param options - the options you want to use to apply to this association
   * @returns A BelongsTo decorator
   */
  public BelongsTo<
    const AssociationGlobalNameOrNames extends
      | keyof GlobalModelNameTableMap<T>
      | (keyof GlobalModelNameTableMap<T>)[],
  >(this: Decorators<TD>, globalAssociationNameOrNames: AssociationGlobalNameOrNames, options: unknown = {}) {
    return BelongsTo<T, AssociationGlobalNameOrNames>(globalAssociationNameOrNames, options as any)
  }

  ///////////
  // HasMany
  ///////////
  public HasMany<
    const AssociationGlobalName extends keyof GlobalModelNameTableMap<T>,
    const ThroughAssociationName extends keyof T['schema'][T['table']]['associations'],
  >(
    this: Decorators<TD>,
    globalAssociationNameOrNames: AssociationGlobalName,
    options?: HasManyOptions<T, AssociationGlobalName, ThroughAssociationName>
  ): any

  public HasMany<
    const AssociationGlobalName extends keyof GlobalModelNameTableMap<T>,
    const ThroughAssociationName extends keyof T['schema'][T['table']]['associations'],
  >(
    this: Decorators<TD>,
    globalAssociationNameOrNames: AssociationGlobalName,
    options?: HasManyThroughOptions<T, AssociationGlobalName, ThroughAssociationName>
  ): any

  public HasMany<
    const AssociationGlobalName extends keyof GlobalModelNameTableMap<T>,
    const ThroughAssociationName extends keyof T['schema'][T['table']]['associations'],
  >(
    this: Decorators<TD>,
    globalAssociationNameOrNames: AssociationGlobalName,
    options?: PolymorphicHasManyOptions<T, AssociationGlobalName, ThroughAssociationName>
  ): any

  /**
   *
   * Establishes a "HasMany" association between the base dream
   * and the child dream, where the child dream has a foreign key
   * which points back to the base dream.
   *
   * ```ts
   * class User extends ApplicationModel {
   *   @deco.HasMany('Post')
   *   public posts: Post[]
   * }
   *
   * class Post extends ApplicationModel {
   *   @deco.BelongsTo('User')
   *   public user: User
   *   public userId: DreamColumn<Post, 'userId'>
   * }
   * ```
   *
   * @param modelCB - a function that immediately returns the dream class you are associating with this dream class
   * @param options - the options you want to use to apply to this association
   * @returns A HasMany decorator
   */
  public HasMany<
    const AssociationGlobalName extends keyof GlobalModelNameTableMap<T>,
    const ThroughAssociationName extends keyof T['schema'][T['table']]['associations'],
  >(this: Decorators<TD>, globalAssociationNameOrNames: AssociationGlobalName, options: unknown = {}) {
    return HasMany<T, AssociationGlobalName, ThroughAssociationName>(
      globalAssociationNameOrNames,
      options as any
    )
  }
  ///////////////
  // end: HasMany
  //////////////

  ///////////
  // HasOne
  ///////////
  public HasOne<
    const AssociationGlobalName extends keyof GlobalModelNameTableMap<T>,
    const ThroughAssociationName extends keyof T['schema'][T['table']]['associations'],
  >(
    this: Decorators<TD>,
    globalAssociationNameOrNames: AssociationGlobalName,
    options?: HasOneOptions<T, AssociationGlobalName, ThroughAssociationName>
  ): any

  public HasOne<
    const AssociationGlobalName extends keyof GlobalModelNameTableMap<T>,
    const ThroughAssociationName extends keyof T['schema'][T['table']]['associations'],
  >(
    this: Decorators<TD>,
    globalAssociationNameOrNames: AssociationGlobalName,
    options?: HasOneThroughOptions<T, AssociationGlobalName, ThroughAssociationName>
  ): any

  public HasOne<
    const AssociationGlobalName extends keyof GlobalModelNameTableMap<T>,
    const ThroughAssociationName extends keyof T['schema'][T['table']]['associations'],
  >(
    this: Decorators<TD>,
    globalAssociationNameOrNames: AssociationGlobalName,
    options?: PolymorphicHasOneOptions<T, AssociationGlobalName, ThroughAssociationName>
  ): any

  /**
   * Establishes a "HasOne" association between the base dream
   * and the child dream, where the child dream has a foreign key
   * which points back to the base dream.
   *
   * ```ts
   * class User extends ApplicationModel {
   *   @deco.HasOne('UserSettings')
   *   public userSettings: UserSettings
   * }
   *
   * class UserSettings extends ApplicationModel {
   *   @deco.BelongsTo('User')
   *   public user: User
   *   public userId: DreamColumn<UserSettings, 'userId'>
   * }
   * ```
   *
   * @param modelCB - A function that immediately returns the dream class you are associating with this dream class
   * @param options - The options you want to use to apply to this association
   * @returns A HasOne decorator
   */
  public HasOne<
    const AssociationGlobalName extends keyof GlobalModelNameTableMap<T>,
    const ThroughAssociationName extends keyof T['schema'][T['table']]['associations'],
  >(this: Decorators<TD>, globalAssociationNameOrNames: AssociationGlobalName, options: unknown = {}): any {
    return HasOne<T, AssociationGlobalName, ThroughAssociationName>(
      globalAssociationNameOrNames,
      options as any
    )
  }
  //////////////
  // end: HasOne
  //////////////

  /**
   * The Encrypted decorator automatically encrypts (upon setting)
   * and decrypts (upon getting) so that the encrypted value is
   * stored in the database.
   *
   * ```ts
   * class User {
   *   @deco.Encrypted()
   *   // automatically sets `encryptedSsn` to the encrypted value that
   *   // `ssn` is set to in new/create/update, e.g., `await user.update({ ssn })`
   *   public ssn: string
   *
   *   // automatically sets `myEncryptedPhone` to the encrypted value that
   *   // `phone` is set to new/create/update, e.g., `await user.update({ phone })`
   *   @deco.Encrypted('myEncryptedPhone)
   *   public phone: string
   * }
   * ```
   *
   * @param column — if omitted, then 'encrypted' is prepended to the Pascal cased version of the decorated field
   * @returns An Encrypted decorator
   */
  public Encrypted(this: Decorators<TD>, column?: DreamColumnNames<T>) {
    return Encrypted(column)
  }

  /**
   * The Scope decorator decorates a static method that accepts
   * and returns a Dream Query.
   *
   * ```ts
   * class Collar {
   *   @deco.Scope({ default: true })
   *   public static hideHiddenCollars(query: Query<Collar>) {
   *     return query.where({ hidden: false })
   *   }
   * }
   * ```
   *
   * @param opts — optional options
   * @param opts.default - boolean: if true, then this scope will be applied to all queries involving this model
   * @returns A Scope decorator
   */
  public Scope(
    this: Decorators<TD>,
    opts: {
      /**
       * If `true`, this scope will be applied automatically to all queries involving this model.
       * Defaults to `false`.
       */
      default?: boolean
    } = {}
  ) {
    return Scope(opts)
  }

  /**
   * Marks an integer column as a sortable position: Dream keeps the positions of
   * every record in a sort scope contiguous, starting at 1, as records are
   * created, moved, destroyed and undestroyed. A concurrent write racing a
   * cascaded destroy or undestroy, under **Cascaded destroy and undestroy**
   * below, is the one thing that can leave a scope with a gap;
   * `Model.resort('position')` closes it.
   *
   * ```ts
   * class Post extends ApplicationModel {
   *   @deco.Sortable({ scope: 'user' })
   *   public position: number
   * }
   *
   * await post.update({ position: 2 }) // the records at 2 and above shift up
   * ```
   *
   * A position past the end of the scope is clamped to the end, and a position
   * below 1 — or none at all — lands the record at the end.
   *
   * **A save that changes the sort scope ignores a position given alongside it.**
   * The record lands at the end of the scope it moves into, whatever position the
   * same `update` supplied:
   *
   * ```ts
   * await post.update({ user: otherUser, position: 1 })
   * // post is now the last record in otherUser's scope, not the first
   * ```
   *
   * Move it in two saves to place it: `await post.update({ user: otherUser })`,
   * then `await post.update({ position: 1 })`.
   *
   * Sortable requires a query driver that supports advisory transaction locks —
   * the `PostgresQueryDriver` does — since a position write serializes the
   * writers of its sort scope on one, apart from the cascades described below.
   * This concurrency guarantee first shipped
   * in Dream 2.28.0 and begins only after every writer is running a lock-aware
   * release. During the first rolling deployment, older processes take no
   * advisory locks and can still race the upgraded processes.
   *
   * All participating Dream writers of one hot scope serialize. Ordinary saves
   * and destroys with `skipHooks`, direct query writes, raw SQL, and older
   * pre-lock Dream processes bypass Sortable maintenance and do not participate
   * in its locking protocol; a cascaded destroy or undestroy performs its
   * maintenance but does not participate either. A direct undestroy still
   * performs stabilized Sortable maintenance and acquires scope locks with
   * `skipHooks: true`; locked query
   * batches likewise acquire their scope locks during preflight, before any
   * per-record callbacks, even when those callbacks skip hooks. A waiter that
   * enters the protocol holds a pooled connection until the holder finishes or
   * `sortableScopeLockTimeout` expires; sustained contention can therefore
   * produce latency waves, timeouts, and pool starvation. Keep database work
   * inside the lock window short, and avoid cross-region database latency for
   * hot scopes.
   *
   * **Cascaded destroy and undestroy take no scope lock.** A record destroyed or
   * undestroyed because its owner was — reached through a `dependent: 'destroy'`
   * association, or through the undestroy that restores one — does its position
   * work without the advisory lock, so a cascade holds no lock per sort scope it
   * touches, however many scopes that is. Calling `destroy()` or `undestroy()`
   * on a record yourself is unchanged. Where the cascade is destroying the owner
   * of a sort scope — a `HasMany` whose foreign key is one of the field's scope
   * columns, with no condition and not `through`, not polymorphic, whose target
   * is not an STI child and declares no default scope other than
   * `@deco.SoftDelete` — every row of that scope goes with it, and the cascade
   * neither reads nor compacts it. Any other cascaded destroy compacts the
   * scope it vacates, and every cascaded undestroy appends at the end of its
   * scope, exactly as the direct operations do, only without the lock.
   *
   * Without the lock, a writer of the same sort scope during the cascade — a
   * create, a move, a destroy, a `resort` — is not kept out, which costs one of
   * two things. A gap: positions stay unique and correctly ordered, and
   * `Model.resort('position')` closes it. Or two live rows sharing a position,
   * which the deferrable unique constraint refuses when the later of the two
   * transactions reaches COMMIT — as a unique violation, or as a deadlock when
   * both reach it together — so nothing half-done commits and no commit hook
   * runs. A `destroy()` or `undestroy()` whose transaction Dream opened runs the
   * whole operation again on such a refusal, up to three times, before letting
   * the adapter's error escape. Inside a transaction you opened, that error is
   * your COMMIT failing: retry the transaction from the beginning, as for a
   * deadlock. The other writer can lose the same race and fail at its own
   * COMMIT instead, an ordinary `create` or `update` included, and Dream does
   * not run those again. A sort scope with a nullable column has no such
   * backstop unless its constraint is declared `NULLS NOT DISTINCT`, since a
   * plain unique constraint never sees two NULLs as equal.
   *
   * `SortableScopeDidNotStabilize` and `SortableScopeLockWaitTimedOut` are the
   * expected Dream errors an application may choose to retry. Database deadlocks
   * remain native adapter errors (for example PostgreSQL code `40P01` or MySQL
   * errno `1213`) so their driver fields and stacks remain intact. A database
   * deadlock aborts the whole transaction: retry by starting the transaction
   * again from the beginning, never by continuing it or retrying only the failed
   * statement. Recurrent deadlocks call for shorter transactions or a consistent
   * multi-resource acquisition order; they do not by themselves prove Sortable
   * caused the cycle.
   *
   * ```ts
   * import {
   *   SortableScopeDidNotStabilize,
   *   SortableScopeLockWaitTimedOut,
   * } from '@rvoh/dream/errors'
   *
   * const runTransaction = async () =>
   *   await ApplicationModel.transaction(async txn => {
   *     // bind every operation in the attempt to txn
   *   })
   *
   * try {
   *   await runTransaction()
   * } catch (error) {
   *   const adapterDeadlock =
   *     (error as { code?: string }).code === '40P01' ||
   *     (error as { errno?: number }).errno === 1213
   *   const retryable =
   *     error instanceof SortableScopeDidNotStabilize ||
   *     error instanceof SortableScopeLockWaitTimedOut ||
   *     adapterDeadlock
   *   if (!retryable) throw error
   *
   *   await runTransaction() // one whole-transaction retry
   * }
   * ```
   *
   * NOTE: the Sortable decorator may not be used in STI child models (it may be used in the STI base class)
   *
   * @param opts - Configuration options for the sortable decorator
   * @param opts.scope - The column, association, or combination thereof which you would like to restrict the incrementing logic to. Can be a single column name, a single belongs-to association name, or an array of column/association names
   * @returns A Sortable decorator
   */
  public Sortable(this: Decorators<TD>, opts?: SortableOptions<T>) {
    return Sortable(opts)
  }

  /**
   * The Validate decorator decorates a method to run
   * before saving a model to the database.
   *
   *
   * ```ts
   * class Sandbag {
   *   @deco.Validate()
   *   public validateWeight(this: Sandbag) {
   *     if (!this.weight) return
   *
   *     const undefinedOrNull: any[] = [undefined, null]
   *     if (!undefinedOrNull.includes(this.weightKgs))
   *       this.addError('weight', 'cannot include weightKgs AND weight')
   *     if (!undefinedOrNull.includes(this.weightTons))
   *       this.addError('weight', 'cannot include weightTons AND weight')
   *   }
   * }
   * ```
   *
   * @returns A Validate decorator
   */
  public Validate(this: Decorators<TD>) {
    return Validate()
  }

  /**
   * The Validates decorator decorates a field to validate
   * according to the specified validator and options.
   *
   *
   * ```ts
   * class Balloon {
   *   @deco.Validates('numericality', { min: 0, max: 100 })
   *   public volume: DreamColumn<Balloon, 'volume'>
   * }
   * ```
   *
   * @param type — the type of validation
   * @param args — optional arguments specific to the type of validation
   * @returns A Validates decorator
   */
  public Validates<
    VT extends ValidationType,
    VTArgs extends VT extends 'numericality'
      ? {
          /** The minimum allowed value (inclusive). */
          min?: number
          /** The maximum allowed value (inclusive). */
          max?: number
        }
      : VT extends 'length'
        ? {
            /** The minimum allowed length (inclusive). */
            min: number
            /** The maximum allowed length (inclusive). */
            max?: number
          }
        : VT extends 'contains'
          ? string | RegExp
          : never,
  >(this: Decorators<TD>, type: VT, args?: VTArgs): any {
    return Validates(type, args)
  }

  /**
   * The Virtual decorator enables setting of fields as if they
   * corresponded to columns in the model's table so they can
   * be passed to new, create, and update.
   *
   * For example, in the first example, below, one could call
   * `await bodyMeasurement.update({ lbs 180.1 })`, and `180.1` will be
   * passed into the `lbs` setter, which then translates lbs
   * to grams to be stored in the `grams` column in the metrics
   * table.
   *
   * And in the second example, below, one could call
   * `await user.update({ password })`, and, in the BeforeSave
   * lifecycle hook, the password would be hashed into
   * `hashedPassword`. (This is just an example to illustrate
   * using the Virtual decorator on a simple field; it might be
   * better design to use the getter/setter pattern for password,
   * with the getter simply returning `undefined`.)
   *
   *
   * ```ts
   * class BodyMeasurement {
   *   @deco.Virtual('number')
   *   public get lbs() {
   *     const self: User = this
   *     return gramsToLbs(self.getAttribute('grams') ?? 0)
   *   }
   *
   *   public set lbs(lbs: number) {
   *     const self: User = this
   *     self.setAttribute('grams', lbsToGrams(lbs))
   *   }
   *
   *   @deco.Virtual('number')
   *   public get kilograms() {
   *     const self: User = this
   *     return gramsToKilograms(self.getAttribute('grams') ?? 0)
   *   }
   *
   *   public set kilograms(kg: number) {
   *     const self: User = this
   *     self.setAttribute('grams', kilogramsToGrams(kg))
   *   }
   * }
   * ```
   *
   *
   * ```ts
   * class User {
   *   @deco.Virtual('string')
   *   public password: string
   *
   *   @deco.BeforeSave()
   *   public hasPassword() {
   *     this.setAttribute('hashedPassword', preferredHashingAlgorithm(this.password))
   *   }
   * }
   * ```
   *
   * @param openapi - Required. The OpenAPI shape that defines both the serializer OpenAPI shape and request body OpenAPI shape (in Psychic)
   * @returns A Virtual decorator
   */
  public Virtual(this: Decorators<TD>, openapi: OpenapiShorthandPrimitiveTypes | OpenapiSchemaBodyShorthand) {
    return Virtual(openapi)
  }

  /**
   * BeforeCreate decorator
   *
   * ```ts
   * class User {
   *   @deco.BeforeCreate()
   *   public doSomething() {
   *     console.log('hi!')
   *   }
   * }
   * ```
   *
   * @returns The BeforeCreate decorator
   *
   */
  public BeforeCreate(this: Decorators<TD>, opts?: BeforeHookOpts<T>) {
    return BeforeCreate<T>(opts)
  }

  /**
   * BeforeSave decorator
   *
   * ```ts
   * class User {
   *   @deco.BeforeSave()
   *   public doSomething() {
   *     console.log('hi!')
   *   }
   * }
   * ```
   *
   * @returns The BeforeSave decorator
   *
   */
  public BeforeSave(this: Decorators<TD>, opts?: BeforeHookOpts<T>) {
    return BeforeSave<T>(opts)
  }

  /**
   * BeforeUpdate decorator
   *
   * ```ts
   * class User {
   *   @deco.BeforeUpdate()
   *   public doSomething() {
   *     console.log('hi!')
   *   }
   * }
   * ```
   *
   * @returns The BeforeUpdate decorator
   *
   */
  public BeforeUpdate(this: Decorators<TD>, opts?: BeforeHookOpts<T>) {
    return BeforeUpdate<T>(opts)
  }

  /**
   * BeforeDestroy decorator
   *
   * ```ts
   * class User {
   *   @deco.BeforeDestroy()
   *   public doSomething() {
   *     console.log('hi!')
   *   }
   * }
   * ```
   *
   * @returns The BeforeDestroy decorator
   */
  public BeforeDestroy(this: Decorators<TD>) {
    return BeforeDestroy()
  }

  /**
   * AfterCreate decorator
   *
   * ```ts
   * class User {
   *   @deco.AfterCreate()
   *   public doSomething() {
   *     console.log('hi!')
   *   }
   * }
   * ```
   *
   * @returns The AfterCreate decorator
   *
   */
  public AfterCreate(this: Decorators<TD>, opts?: AfterHookOpts<T>) {
    return AfterCreate<T>(opts)
  }

  /**
   * AfterCreateCommit decorator
   *
   * ```ts
   * class User {
   *   @deco.AfterCreateCommit()
   *   public doSomething() {
   *     console.log('hi!')
   *   }
   * }
   * ```
   *
   * @returns The AfterCreateCommit decorator
   */
  public AfterCreateCommit(this: Decorators<TD>, opts?: AfterHookOpts<T>) {
    return AfterCreateCommit<T>(opts)
  }

  /**
   * AfterSave decorator
   *
   * ```ts
   * class User {
   *   @deco.AfterSave()
   *   public doSomething() {
   *     console.log('hi!')
   *   }
   * }
   * ```
   *
   * @returns The AfterSave decorator
   *
   */
  public AfterSave(this: Decorators<TD>, opts?: AfterHookOpts<T>) {
    return AfterSave<T>(opts)
  }

  /**
   * AfterSaveCommit decorator
   *
   * ```ts
   * class User {
   *   @deco.AfterSaveCommit()
   *   public doSomething() {
   *     console.log('hi!')
   *   }
   * }
   * ```
   *
   * @returns The AfterSaveCommit decorator
   *
   */
  public AfterSaveCommit(this: Decorators<TD>, opts?: AfterHookOpts<T>) {
    return AfterSaveCommit<T>(opts)
  }

  /**
   * AfterUpdate decorator
   *
   * ```ts
   * class User {
   *   @deco.AfterUpdate()
   *   public doSomething() {
   *     console.log('hi!')
   *   }
   * }
   * ```
   *
   * @returns The AfterUpdate decorator
   *
   */
  public AfterUpdate(this: Decorators<TD>, opts?: AfterHookOpts<T>) {
    return AfterUpdate<T>(opts)
  }

  /**
   * AfterUpdateCommit decorator
   *
   * ```ts
   * class User {
   *   @deco.AfterUpdateCommit()
   *   public doSomething() {
   *     console.log('hi!')
   *   }
   * }
   * ```
   *
   * @returns The AfterUpdateCommit decorator
   *
   */
  public AfterUpdateCommit(this: Decorators<TD>, opts?: AfterHookOpts<T>) {
    return AfterUpdateCommit<T>(opts)
  }

  /**
   * AfterDestroy decorator
   *
   * ```ts
   * class User {
   *   @deco.AfterDestroy()
   *   public doSomething() {
   *     console.log('hi!')
   *   }
   * }
   * ```
   *
   * @returns The AfterDestroy decorator
   *
   */
  public AfterDestroy(this: Decorators<TD>) {
    return AfterDestroy()
  }

  /**
   * AfterDestroyCommit decorator
   *
   * ```ts
   * class User {
   *   @deco.AfterDestroyCommit()
   *   public doSomething() {
   *     console.log('hi!')
   *   }
   * }
   * ```
   *
   * @returns The AfterDestroyCommit decorator
   *
   */
  public AfterDestroyCommit(this: Decorators<TD>) {
    return AfterDestroyCommit()
  }
}
