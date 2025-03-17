import Dream from '../Dream.js'
import { DreamColumnNames, GlobalModelNameTableMap, SortableOptions } from '../dream/types.js'
import Virtual from './field-or-getter/Virtual.js'
import Encrypted from './field/Encrypted.js'
import BelongsTo, {
  NonPolymorphicBelongsToOptions,
  PolymorphicBelongsToOptions,
} from './field/association/BelongsTo.js'
import HasMany, {
  HasManyOptions,
  HasManyThroughOptions,
  PolymorphicHasManyOptions,
} from './field/association/HasMany.js'
import HasOne, {
  HasOneOptions,
  HasOneThroughOptions,
  PolymorphicHasOneOptions,
} from './field/association/HasOne.js'
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
import { AfterHookOpts, BeforeHookOpts } from './field/lifecycle/shared.js'
import Sortable from './field/sortable/Sortable.js'
import Validates from './field/validation/Validates.js'
import { ValidationType } from './field/validation/shared.js'
import Validate from './method/Validate.js'
import Scope from './static-method/Scope.js'

export default class Decorators<T extends Dream> {
  public BelongsTo<
    const AssociationGlobalNameOrNames extends
      | keyof GlobalModelNameTableMap<T>
      | (keyof GlobalModelNameTableMap<T>)[],
  >(
    this: Decorators<T>,
    globalAssociationNameOrNames: AssociationGlobalNameOrNames,
    options?: NonPolymorphicBelongsToOptions<T, AssociationGlobalNameOrNames>
  ): any

  public BelongsTo<
    const AssociationGlobalNameOrNames extends
      | keyof GlobalModelNameTableMap<T>
      | (keyof GlobalModelNameTableMap<T>)[],
  >(
    this: Decorators<T>,
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
   *   @Deco.BelongsTo('User')
   *   public user: User
   *   public userId: DreamColumn<UserSettings, 'userId'>
   * }
   *
   * class User extends ApplicationModel {
   *   @Deco.HasOne('UserSettings')
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
  >(this: Decorators<T>, globalAssociationNameOrNames: AssociationGlobalNameOrNames, options: unknown = {}) {
    return BelongsTo<T, AssociationGlobalNameOrNames>(globalAssociationNameOrNames, options as any)
  }

  ///////////
  // HasMany
  ///////////
  public HasMany<const AssociationGlobalName extends keyof GlobalModelNameTableMap<T>>(
    this: Decorators<T>,
    globalAssociationNameOrNames: AssociationGlobalName,
    options?: HasManyOptions<T, AssociationGlobalName>
  ): any

  public HasMany<const AssociationGlobalName extends keyof GlobalModelNameTableMap<T>>(
    this: Decorators<T>,
    globalAssociationNameOrNames: AssociationGlobalName,
    options?: HasManyThroughOptions<T, AssociationGlobalName>
  ): any

  public HasMany<const AssociationGlobalName extends keyof GlobalModelNameTableMap<T>>(
    this: Decorators<T>,
    globalAssociationNameOrNames: AssociationGlobalName,
    options?: PolymorphicHasManyOptions<T, AssociationGlobalName>
  ): any

  /**
   *
   * Establishes a "HasMany" association between the base dream
   * and the child dream, where the child dream has a foreign key
   * which points back to the base dream.
   *
   * ```ts
   * class User extends ApplicationModel {
   *   @Deco.HasMany('Post')
   *   public posts: Post[]
   * }
   *
   * class Post extends ApplicationModel {
   *   @Deco.BelongsTo('User')
   *   public user: User
   *   public userId: DreamColumn<Post, 'userId'>
   * }
   * ```
   *
   * @param modelCB - a function that immediately returns the dream class you are associating with this dream class
   * @param options - the options you want to use to apply to this association
   * @returns A HasMany decorator
   */
  public HasMany<const AssociationGlobalName extends keyof GlobalModelNameTableMap<T>>(
    this: Decorators<T>,
    globalAssociationNameOrNames: AssociationGlobalName,
    options: unknown = {}
  ) {
    return HasMany<T, AssociationGlobalName>(globalAssociationNameOrNames, options as any)
  }
  ///////////////
  // end: HasMany
  //////////////

  ///////////
  // HasOne
  ///////////
  public HasOne<const AssociationGlobalName extends keyof GlobalModelNameTableMap<T>>(
    this: Decorators<T>,
    globalAssociationNameOrNames: AssociationGlobalName,
    options?: HasOneOptions<T, AssociationGlobalName>
  ): any

  public HasOne<const AssociationGlobalName extends keyof GlobalModelNameTableMap<T>>(
    this: Decorators<T>,
    globalAssociationNameOrNames: AssociationGlobalName,
    options?: HasOneThroughOptions<T, AssociationGlobalName>
  ): any

  public HasOne<const AssociationGlobalName extends keyof GlobalModelNameTableMap<T>>(
    this: Decorators<T>,
    globalAssociationNameOrNames: AssociationGlobalName,
    options?: PolymorphicHasOneOptions<T, AssociationGlobalName>
  ): any

  /**
   * Establishes a "HasOne" association between the base dream
   * and the child dream, where the child dream has a foreign key
   * which points back to the base dream.
   *
   * ```ts
   * class User extends ApplicationModel {
   *   @Deco.HasOne('UserSettings')
   *   public userSettings: UserSettings
   * }
   *
   * class UserSettings extends ApplicationModel {
   *   @Deco.BelongsTo('User')
   *   public user: User
   *   public userId: DreamColumn<UserSettings, 'userId'>
   * }
   * ```
   *
   * @param modelCB - A function that immediately returns the dream class you are associating with this dream class
   * @param options - The options you want to use to apply to this association
   * @returns A HasOne decorator
   */
  public HasOne<const AssociationGlobalName extends keyof GlobalModelNameTableMap<T>>(
    this: Decorators<T>,
    globalAssociationNameOrNames: AssociationGlobalName,
    options: unknown = {}
  ): any {
    return HasOne<T, AssociationGlobalName>(globalAssociationNameOrNames, options as any)
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
   *   @Deco.Encrypted()
   *   // automatically sets `encryptedSsn` to the encrypted value that
   *   // `ssn` is set to in new/create/update, e.g., `await user.update({ ssn })`
   *   public ssn: string
   *
   *   // automatically sets `myEncryptedPhone` to the encrypted value that
   *   // `phone` is set to new/create/update, e.g., `await user.update({ phone })`
   *   @Deco.Encrypted('myEncryptedPhone)
   *   public phone: string
   * }
   * ```
   *
   * @param column — if omitted, then 'encrypted' is prepended to the Pascal cased version of the decorated field
   * @returns An Encrypted decorator
   */
  public Encrypted(this: Decorators<T>, column?: DreamColumnNames<T>) {
    return Encrypted(column)
  }

  /**
   * The Scope decorator decorates a static method that accepts
   * and returns a Dream Query.
   *
   * ```ts
   * class Collar {
   *   @Deco.Scope({ default: true })
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
    this: Decorators<T>,
    opts: {
      default?: boolean
    } = {}
  ) {
    return Scope(opts)
  }

  /**
   * The Sortable decorator automatically adjusts the value of the columns
   * corresponding to the decorated field.
   *
   * NOTE: the Sortable decorator may not be used in STI child models (it may be used in the STI base class)
   *
   * ```ts
   * class Balloon {
   *   @Deco.Sortable({ scope: 'user' })
   *   public position: DreamColumn<Balloon, 'position'>
   * }
   * ```
   *
   * @param scope - The column, association, or combination there-of which you would like to restrict the incrementing logic to
   * @returns A Sortable decorator
   */
  public Sortable(this: Decorators<T>, opts?: SortableOptions<T>) {
    return Sortable(opts)
  }

  /**
   * The Validate decorator decorates a method to run
   * before saving a model to the database.
   *
   *
   * ```ts
   * class Sandbag {
   *   @Deco.Validate()
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
  public Validate(this: Decorators<T>) {
    return Validate()
  }

  /**
   * The Validates decorator decorates a method to run
   * before saving a model to the database.
   *
   *
   * ```ts
   * class Balloon {
   *   @Deco.Validates('numericality', { min: 0, max: 100 })
   *   public volume: DreamColumn<Balloon, 'volume'>
   * }
   * ```
   *
   * @param type — the type of validation
   * @param args — arguments specific to the type of validation
   * @returns A Validates decorator
   */
  public Validates<
    VT extends ValidationType,
    VTArgs extends VT extends 'numericality'
      ? { min?: number; max?: number }
      : VT extends 'length'
        ? { min: number; max?: number }
        : VT extends 'contains'
          ? string | RegExp
          : never,
  >(this: Decorators<T>, type: VT, args?: VTArgs): any {
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
   *   @Deco.Virtual()
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
   *   @Deco.Virtual()
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
   *   @Deco.Virtual()
   *   public password: string
   *
   *   @Deco.BeforeSave()
   *   public hasPassword() {
   *     this.setAttribute('hashedPassword', preferredHashingAlgorithm(this.password))
   *   }
   * }
   * ```
   *
   * @returns An Virtual decorator
   */
  public Virtual(this: Decorators<T>) {
    return Virtual()
  }

  /**
   * BeforeCreate decorator
   *
   * ```ts
   * class User {
   *   @Deco.BeforeCreate()
   *   public doSomething() {
   *     console.log('hi!')
   *   }
   * }
   * ```
   *
   * @returns The BeforeCreate decorator
   *
   */
  public BeforeCreate(this: Decorators<T>, opts?: BeforeHookOpts<T>) {
    return BeforeCreate<T>(opts)
  }

  /**
   * BeforeSave decorator
   *
   * ```ts
   * class User {
   *   @Deco.BeforeSave()
   *   public doSomething() {
   *     console.log('hi!')
   *   }
   * }
   * ```
   *
   * @returns The BeforeSave decorator
   *
   */
  public BeforeSave(this: Decorators<T>, opts?: BeforeHookOpts<T>) {
    return BeforeSave<T>(opts)
  }

  /**
   * BeforeUpdate decorator
   *
   * ```ts
   * class User {
   *   @Deco.BeforeUpdate()
   *   public doSomething() {
   *     console.log('hi!')
   *   }
   * }
   * ```
   *
   * @returns The BeforeUpdate decorator
   *
   */
  public BeforeUpdate(this: Decorators<T>, opts?: BeforeHookOpts<T>) {
    return BeforeUpdate<T>(opts)
  }

  /**
   * BeforeDestroy decorator
   *
   * ```ts
   * class User {
   *   @Deco.BeforeDestroy()
   *   public doSomething() {
   *     console.log('hi!')
   *   }
   * }
   * ```
   *
   * @returns The BeforeDestroy decorator
   */
  public BeforeDestroy(this: Decorators<T>) {
    return BeforeDestroy()
  }

  /**
   * AfterCreate decorator
   *
   * ```ts
   * class User {
   *   @Deco.AfterCreate()
   *   public doSomething() {
   *     console.log('hi!')
   *   }
   * }
   * ```
   *
   * @returns The AfterCreate decorator
   *
   */
  public AfterCreate(this: Decorators<T>, opts?: AfterHookOpts<T>) {
    return AfterCreate<T>(opts)
  }

  /**
   * AfterCreateCommit decorator
   *
   * ```ts
   * class User {
   *   @Deco.AfterCreateCommit()
   *   public doSomething() {
   *     console.log('hi!')
   *   }
   * }
   * ```
   *
   * @returns The AfterCreateCommit decorator
   */
  public AfterCreateCommit(this: Decorators<T>, opts?: AfterHookOpts<T>) {
    return AfterCreateCommit<T>(opts)
  }

  /**
   * AfterSave decorator
   *
   * ```ts
   * class User {
   *   @Deco.AfterSave()
   *   public doSomething() {
   *     console.log('hi!')
   *   }
   * }
   * ```
   *
   * @returns The AfterSave decorator
   *
   */
  public AfterSave(this: Decorators<T>, opts?: AfterHookOpts<T>) {
    return AfterSave<T>(opts)
  }

  /**
   * AfterSaveCommit decorator
   *
   * ```ts
   * class User {
   *   @Deco.AfterSaveCommit()
   *   public doSomething() {
   *     console.log('hi!')
   *   }
   * }
   * ```
   *
   * @returns The AfterSaveCommit decorator
   *
   */
  public AfterSaveCommit(this: Decorators<T>, opts?: AfterHookOpts<T>) {
    return AfterSaveCommit<T>(opts)
  }

  /**
   * AfterUpdate decorator
   *
   * ```ts
   * class User {
   *   @Deco.AfterUpdate()
   *   public doSomething() {
   *     console.log('hi!')
   *   }
   * }
   * ```
   *
   * @returns The AfterUpdate decorator
   *
   */
  public AfterUpdate(this: Decorators<T>, opts?: AfterHookOpts<T>) {
    return AfterUpdate<T>(opts)
  }

  /**
   * AfterUpdateCommit decorator
   *
   * ```ts
   * class User {
   *   @Deco.AfterUpdateCommit()
   *   public doSomething() {
   *     console.log('hi!')
   *   }
   * }
   * ```
   *
   * @returns The AfterUpdateCommit decorator
   *
   */
  public AfterUpdateCommit(this: Decorators<T>, opts?: AfterHookOpts<T>) {
    return AfterUpdateCommit<T>(opts)
  }

  /**
   * AfterDestroy decorator
   *
   * ```ts
   * class User {
   *   @Deco.AfterDestroy()
   *   public doSomething() {
   *     console.log('hi!')
   *   }
   * }
   * ```
   *
   * @returns The AfterDestroy decorator
   *
   */
  public AfterDestroy(this: Decorators<T>) {
    return AfterDestroy()
  }

  /**
   * AfterDestroyCommit decorator
   *
   * ```ts
   * class User {
   *   @Deco.AfterDestroyCommit()
   *   public doSomething() {
   *     console.log('hi!')
   *   }
   * }
   * ```
   *
   * @returns The AfterDestroyCommit decorator
   *
   */
  public AfterDestroyCommit(this: Decorators<T>) {
    return AfterDestroyCommit()
  }
}
