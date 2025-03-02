import Dream from '../Dream'
import { GlobalModelNameTableMap, SortableOptions } from '../dream/types'
import BelongsTo, {
  NonPolymorphicBelongsToOptions,
  PolymorphicBelongsToOptions,
} from './associations/BelongsTo'
import HasMany, {
  HasManyOptions,
  HasManyThroughOptions,
  PolymorphicHasManyOptions,
} from './associations/HasMany'
import HasOne, { HasOneOptions, HasOneThroughOptions, PolymorphicHasOneOptions } from './associations/HasOne'
import AfterCreate from './hooks/AfterCreate'
import AfterCreateCommit from './hooks/AfterCreateCommit'
import AfterDestroy from './hooks/AfterDestroy'
import AfterDestroyCommit from './hooks/AfterDestroyCommit'
import AfterSave from './hooks/AfterSave'
import AfterSaveCommit from './hooks/AfterSaveCommit'
import AfterUpdate from './hooks/AfterUpdate'
import AfterUpdateCommit from './hooks/AfterUpdateCommit'
import BeforeCreate from './hooks/BeforeCreate'
import BeforeDestroy from './hooks/BeforeDestroy'
import BeforeSave from './hooks/BeforeSave'
import BeforeUpdate from './hooks/BeforeUpdate'
import { AfterHookOpts, BeforeHookOpts } from './hooks/shared'
import Sortable from './sortable/Sortable'

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
   *   @UserSettings.BelongsTo('User')
   *   public user: User
   *   public userId: DreamColumn<UserSettings, 'userId'>
   * }
   *
   * class User extends ApplicationModel {
   *   @User.HasOne('UserSettings')
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
  public HasMany<
    const AssociationGlobalNameOrNames extends
      | keyof GlobalModelNameTableMap<T>
      | (keyof GlobalModelNameTableMap<T>)[],
  >(
    this: Decorators<T>,
    globalAssociationNameOrNames: AssociationGlobalNameOrNames,
    options?: HasManyOptions<T, AssociationGlobalNameOrNames>
  ): any

  public HasMany<
    const AssociationGlobalNameOrNames extends
      | keyof GlobalModelNameTableMap<T>
      | (keyof GlobalModelNameTableMap<T>)[],
  >(
    this: Decorators<T>,
    globalAssociationNameOrNames: AssociationGlobalNameOrNames,
    options?: HasManyThroughOptions<T, AssociationGlobalNameOrNames>
  ): any

  public HasMany<
    const AssociationGlobalNameOrNames extends
      | keyof GlobalModelNameTableMap<T>
      | (keyof GlobalModelNameTableMap<T>)[],
  >(
    this: Decorators<T>,
    globalAssociationNameOrNames: AssociationGlobalNameOrNames,
    options?: PolymorphicHasManyOptions<T, AssociationGlobalNameOrNames>
  ): any

  /**
   *
   * Establishes a "HasMany" association between the base dream
   * and the child dream, where the child dream has a foreign key
   * which points back to the base dream.
   *
   * ```ts
   * class User extends ApplicationModel {
   *   @User.HasMany('Post')
   *   public posts: Post[]
   * }
   *
   * class Post extends ApplicationModel {
   *   @Post.BelongsTo('User')
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
    const AssociationGlobalNameOrNames extends
      | keyof GlobalModelNameTableMap<T>
      | (keyof GlobalModelNameTableMap<T>)[],
  >(this: Decorators<T>, globalAssociationNameOrNames: AssociationGlobalNameOrNames, options: unknown = {}) {
    return HasMany<T, AssociationGlobalNameOrNames>(globalAssociationNameOrNames, options as any)
  }
  ///////////////
  // end: HasMany
  //////////////

  ///////////
  // HasOne
  ///////////
  public HasOne<
    const AssociationGlobalNameOrNames extends
      | keyof GlobalModelNameTableMap<T>
      | (keyof GlobalModelNameTableMap<T>)[],
  >(
    this: Decorators<T>,
    globalAssociationNameOrNames: AssociationGlobalNameOrNames,
    options?: HasOneOptions<T, AssociationGlobalNameOrNames>
  ): any

  public HasOne<
    const AssociationGlobalNameOrNames extends
      | keyof GlobalModelNameTableMap<T>
      | (keyof GlobalModelNameTableMap<T>)[],
  >(
    this: Decorators<T>,
    globalAssociationNameOrNames: AssociationGlobalNameOrNames,
    options?: HasOneThroughOptions<T, AssociationGlobalNameOrNames>
  ): any

  public HasOne<
    const AssociationGlobalNameOrNames extends
      | keyof GlobalModelNameTableMap<T>
      | (keyof GlobalModelNameTableMap<T>)[],
  >(
    this: Decorators<T>,
    globalAssociationNameOrNames: AssociationGlobalNameOrNames,
    options?: PolymorphicHasOneOptions<T, AssociationGlobalNameOrNames>
  ): any

  /**
   * Establishes a "HasOne" association between the base dream
   * and the child dream, where the child dream has a foreign key
   * which points back to the base dream.
   *
   * ```ts
   * class User extends ApplicationModel {
   *   @User.HasOne('UserSettings')
   *   public userSettings: UserSettings
   * }
   *
   * class UserSettings extends ApplicationModel {
   *   @UserSettings.BelongsTo('User')
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
    const AssociationGlobalNameOrNames extends
      | keyof GlobalModelNameTableMap<T>
      | (keyof GlobalModelNameTableMap<T>)[],
  >(
    this: Decorators<T>,
    globalAssociationNameOrNames: AssociationGlobalNameOrNames,
    options: unknown = {}
  ): any {
    return HasOne<T, AssociationGlobalNameOrNames>(globalAssociationNameOrNames, options as any)
  }
  //////////////
  // end: HasOne
  //////////////

  /**
   * Shortcut to the Sortable decorator, which also provides extra type protection which cannot be provided
   * with the Sortable decorator.
   *
   * @param scope - The column, association, or combination there-of which you would like to restrict the incrementing logic to
   * @returns A Sortable decorator
   */
  public Sortable(this: Decorators<T>, opts?: SortableOptions<T>) {
    return Sortable(opts)
  }

  /**
   * Shortcut to the BeforeCreate decorator
   *
   * ```ts
   * class User {
   *   User.BeforeCreate()
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
   * Shortcut to the BeforeSave decorator
   *
   * ```ts
   * class User {
   *   User.BeforeSave()
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
   * Shortcut to the BeforeUpdate decorator
   *
   * ```ts
   * class User {
   *   User.BeforeUpdate()
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
   * Shortcut to the BeforeDestroy decorator
   *
   * ```ts
   * class User {
   *   User.BeforeDestroy()
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
   * Shortcut to the AfterCreate decorator
   *
   * ```ts
   * class User {
   *   User.AfterCreate()
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
   * Shortcut to the AfterCreateCommit decorator
   *
   * ```ts
   * class User {
   *   User.AfterCreateCommit()
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
   * Shortcut to the AfterSave decorator
   *
   * ```ts
   * class User {
   *   User.AfterSave()
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
   * Shortcut to the AfterSaveCommit decorator
   *
   * ```ts
   * class User {
   *   User.AfterSaveCommit()
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
   * Shortcut to the AfterUpdate decorator
   *
   * ```ts
   * class User {
   *   User.AfterUpdate()
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
   * Shortcut to the AfterUpdateCommit decorator
   *
   * ```ts
   * class User {
   *   User.AfterUpdateCommit()
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
   * Shortcut to the AfterDestroy decorator
   *
   * ```ts
   * class User {
   *   User.AfterDestroy()
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
   * Shortcut to the AfterDestroyCommit decorator
   *
   * ```ts
   * class User {
   *   User.AfterDestroyCommit()
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
