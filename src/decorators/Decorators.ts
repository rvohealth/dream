import Dream from '../Dream.js'
import { EncryptedOptions, GlobalModelNameTableMap, SortableOptions } from '../dream/types.js'
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
   * Encrypted decorator.
   *
   * NOTE: the Encrypted decorator may not be used in STI child models (it may be used in the STI base class)
   *
   * ```ts
   * class Balloon {
   *   @Deco.Encrypted()
   *   public position: DreamColumn<Balloon, 'position'>
   * }
   * ```
   *
   * @param scope - The column into which to store the encrypted value
   * @returns An Encrypted decorator
   */
  public Encrypted(this: Decorators<T>, opts?: EncryptedOptions<T>) {
    return Encrypted(opts)
  }

  /**
   * Sortable decorator.
   *
   * NOTE: the Sortable decorator may not be used in STI child models (it may be used in the STI base class)
   *
   * ```ts
   * class Balloon {
   *   @Deco.Sortable()
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
