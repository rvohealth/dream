import Dream from '../Dream.js'
import CannotAssociationQueryOnUnpersistedDream from '../errors/associations/CannotAssociationQueryOnUnpersistedDream.js'
import CannotCreateAssociationOnUnpersistedDream from '../errors/associations/CannotCreateAssociationOnUnpersistedDream.js'
import CannotDestroyAssociationOnUnpersistedDream from '../errors/associations/CannotDestroyAssociationOnUnpersistedDream.js'
import CannotUpdateAssociationOnUnpersistedDream from '../errors/associations/CannotUpdateAssociationOnUnpersistedDream.js'
import {
  AllDefaultScopeNames,
  AssociationNameToDream,
  DreamAssociationNames,
  DreamAssociationNamesWithoutRequiredOnClauses,
  DreamAttributes,
  DreamConstructorType,
  DreamSerializerKey,
  JoinAndStatements,
  UpdateableAssociationProperties,
  UpdateableProperties,
} from '../types/dream.js'
import {
  DefaultQueryTypeOptions,
  LoadForModifierFn,
  QueryWithJoinedAssociationsType,
} from '../types/query.js'
import {
  JoinedAssociation,
  JoinedAssociationsTypeFromAssociations,
  RequiredOnClauseKeys,
  VariadicJoinsArgs,
  VariadicLeftJoinLoadArgs,
  VariadicLoadArgs,
} from '../types/variadic.js'
import DreamTransaction from './DreamTransaction.js'
import associationQuery from './internal/associations/associationQuery.js'
import associationUpdateQuery from './internal/associations/associationUpdateQuery.js'
import createAssociation from './internal/associations/createAssociation.js'
import destroyAssociation from './internal/associations/destroyAssociation.js'
import undestroyAssociation from './internal/associations/undestroyAssociation.js'
import destroyDream from './internal/destroyDream.js'
import {
  destroyOptions,
  DestroyOptions,
  reallyDestroyOptions,
  undestroyOptions,
} from './internal/destroyOptions.js'
import reload from './internal/reload.js'
import saveDream from './internal/saveDream.js'
import {
  DEFAULT_BYPASS_ALL_DEFAULT_SCOPES,
  DEFAULT_DEFAULT_SCOPES_TO_BYPASS,
  DEFAULT_SKIP_HOOKS,
} from './internal/scopeHelpers.js'
import undestroyDream from './internal/undestroyDream.js'
import LeftJoinLoadBuilder from './LeftJoinLoadBuilder.js'
import LoadBuilder from './LoadBuilder.js'
import Query from './Query.js'

export default class DreamInstanceTransactionBuilder<DreamInstance extends Dream> {
  /**
   * Constructs a new DreamInstanceTransactionBuilder.
   *
   * @param dreamInstance - The Dream instance to build the transaction for
   * @param txn - The DreamTransaction instance
   */
  constructor(
    private dreamInstance: DreamInstance,
    private dreamTransaction: DreamTransaction<Dream> | null
  ) {}

  /**
   * Loads the requested associations upon execution
   *
   * NOTE: {@link Dream#preload} is often a preferrable way of achieving the
   * same goal.
   *
   * ```ts
   * await user
   *  .load('posts', { body: ops.ilike('%hello world%') }, 'comments', 'replies')
   *  .load('images')
   *  .execute()
   *
   * user.posts[0].comments[0].replies[0]
   * // Reply{}
   *
   * user.images[0]
   * // Image{}
   * ```
   *
   * @param args - A list of associations (and optional where clauses) to load
   * @returns A chainable LoadBuilder instance
   */
  public load<
    I extends DreamInstanceTransactionBuilder<DreamInstance>,
    DB extends DreamInstance['DB'],
    TableName extends DreamInstance['table'],
    Schema extends DreamInstance['schema'],
    const Arr extends readonly unknown[],
  >(this: I, ...args: [...Arr, VariadicLoadArgs<DB, Schema, TableName, Arr>]): LoadBuilder<DreamInstance> {
    return new LoadBuilder<DreamInstance>(this.dreamInstance, this.dreamTransaction).load(...(args as any))
  }

  /**
   * Recursively loads all Dream associations referenced by `rendersOne` and `rendersMany`
   * in a DreamSerializer. This traverses the entire content tree of serializers to automatically
   * load all necessary associations, eliminating N+1 query problems and removing the need to
   * manually remember which associations to preload for serialization.
   *
   * This method decouples data loading code from data rendering code by having the serializer
   * (rendering code) inform the query (loading code) about which associations are needed.
   * As serializers evolve over time - adding new `rendersOne` and `rendersMany` calls or
   * modifying existing ones - the loading code automatically adapts without requiring
   * corresponding modifications to preload statements.
   *
   * This method analyzes the serializer (specified by `serializerKey` or 'default') and
   * automatically preloads all associations that will be needed during serialization.
   *
   * ```ts
   * // Instead of manually specifying all associations:
   * await User.preload('posts', 'comments', 'replies').all()
   *
   * // Automatically preload everything needed for serialization:
   * await user.loadFor('summary').execute()
   *
   * // Add where conditions to specific associations during preloading:
   * await user.txn(txn).loadFor('detailed', (associationName, dreamClass) => {
   *   if (dreamClass.typeof(Post) && associationName === 'comments') {
   *     return { and: { published: true } }
   *   }
   * })
   *    .execute()
   *
   * // Skip preloading specific associations to handle them manually:
   * await user
   *   .txn(txn)
   *   .loadFor('summary', (associationName, dreamClass) => {
   *     if (dreamClass.typeof(User) && associationName === 'posts') {
   *       return 'omit' // Handle posts preloading separately with custom logic
   *     }
   *   })
   *     .load('posts', { and: { featured: true } }) // Custom preloading
   *     .execute()
   * ```
   *
   * @param serializerKey - The serializer key to use for determining which associations to preload.
   * @param modifierFn - Optional callback function to modify or omit specific associations during preloading. Called for each association with the Dream class and association name. Return an object with `and`, `andAny`, or `andNot` properties to add where conditions, return 'omit' to skip preloading that association (useful when you want to handle it manually), or return undefined to use default preloading
   * @returns A Query with all serialization associations preloaded
   */
  public loadFor<
    I extends DreamInstanceTransactionBuilder<DreamInstance>,
    SerializerKey extends DreamSerializerKey<DreamInstance>,
  >(this: I, serializerKey: SerializerKey, modifierFn?: LoadForModifierFn) {
    return new LoadBuilder<DreamInstance>(this.dreamInstance, this.dreamTransaction)['loadFor'](
      serializerKey,
      modifierFn
    )
  }

  /**
   * Load each specified association using a single SQL query.
   * See {@link #load} for loading in separate queries.
   *
   * Note: since leftJoinPreload loads via single query, it has
   * some downsides and that may be avoided using {@link #load}:
   * 1. `limit` and `offset` will be automatically removed
   * 2. `through` associations will bring additional namespaces into the query that can conflict with through associations from other associations, creating an invalid query
   * 3. each nested association will result in an additional record which duplicates data from the outer record. E.g., given `.leftJoinPreload('a', 'b', 'c')`, if each `a` has 10 `b` and each `b` has 10 `c`, then for one `a`, 100 records will be returned, each of which has all of the columns of `a`. `.load('a', 'b', 'c')` would perform three separate SQL queries, but the data for a single `a` would only be returned once.
   * 4. the individual query becomes more complex the more associations are included
   * 5. associations loading associations loading associations could result in exponential amounts of data; in those cases, `.load(...).findEach(...)` avoids instantiating massive amounts of data at once
   * Loads the requested associations upon execution
   *
   * NOTE: {@link Dream#leftJoinPreload} is often a preferrable way of achieving the
   * same goal.
   *
   * ```ts
   * await user.txn(txn)
   *  .leftJoinLoad('posts', { body: ops.ilike('%hello world%') }, 'comments', 'replies')
   *  .leftJoinLoad('images')
   *  .execute()
   *
   * user.posts[0].comments[0].replies[0]
   * // Reply{}
   *
   * user.images[0]
   * // Image{}
   * ```
   *
   * @param args - A list of associations (and optional where clauses) to load
   * @returns A chainable LeftJoinLoadBuilder instance
   */
  public leftJoinLoad<
    I extends DreamInstanceTransactionBuilder<DreamInstance>,
    DB extends DreamInstance['DB'],
    TableName extends DreamInstance['table'],
    Schema extends DreamInstance['schema'],
    const Arr extends readonly unknown[],
  >(
    this: I,
    ...args: [...Arr, VariadicLeftJoinLoadArgs<DB, Schema, TableName, Arr>]
  ): LeftJoinLoadBuilder<DreamInstance> {
    return new LeftJoinLoadBuilder<DreamInstance>(this.dreamInstance, this.dreamTransaction).leftJoinLoad(
      ...(args as any)
    )
  }

  /**
   * Recursively loads all Dream associations referenced by `rendersOne` and `rendersMany`
   * in a DreamSerializer. This traverses the entire content tree of serializers to automatically
   * load all necessary associations, eliminating N+1 query problems and removing the need to
   * manually remember which associations to preload for serialization.
   *
   * This method decouples data loading code from data rendering code by having the serializer
   * (rendering code) inform the query (loading code) about which associations are needed.
   * As serializers evolve over time - adding new `rendersOne` and `rendersMany` calls or
   * modifying existing ones - the loading code automatically adapts without requiring
   * corresponding modifications to preload statements.
   *
   * This method analyzes the serializer (specified by `serializerKey` or 'default') and
   * automatically preloads all associations that will be needed during serialization.
   *
   * ```ts
   * // Instead of manually specifying all associations:
   * await User.preload('posts', 'comments', 'replies').all()
   *
   * // Automatically preload everything needed for serialization:
   * await user.leftJoinLoadFor('summary').execute()
   *
   * // Add where conditions to specific associations during preloading:
   * await user.txn(txn).leftJoinLoadFor('detailed', (associationName, dreamClass) => {
   *   if (dreamClass.typeof(Post) && associationName === 'comments') {
   *     return { and: { published: true } }
   *   }
   * })
   *    .execute()
   *
   * // Skip preloading specific associations to handle them manually:
   * await user
   *   .txn(txn)
   *   .leftJoinLoadFor('summary', (associationName, dreamClass) => {
   *     if (dreamClass.typeof(User) && associationName === 'posts') {
   *       return 'omit' // Handle posts preloading separately with custom logic
   *     }
   *   })
   *     .load('posts', { and: { featured: true } }) // Custom preloading
   *     .execute()
   * ```
   *
   * @param serializerKey - The serializer key to use for determining which associations to preload.
   * @param modifierFn - Optional callback function to modify or omit specific associations during preloading. Called for each association with the Dream class and association name. Return an object with `and`, `andAny`, or `andNot` properties to add where conditions, return 'omit' to skip preloading that association (useful when you want to handle it manually), or return undefined to use default preloading
   * @returns A Query with all serialization associations preloaded
   */
  public leftJoinLoadFor<
    I extends DreamInstanceTransactionBuilder<DreamInstance>,
    SerializerKey extends DreamSerializerKey<DreamInstance>,
  >(this: I, serializerKey: SerializerKey, modifierFn?: LoadForModifierFn) {
    return new LeftJoinLoadBuilder<DreamInstance>(this.dreamInstance, this.dreamTransaction)[
      'leftJoinLoadFor'
    ](serializerKey, modifierFn)
  }

  /**
   * Returns a new Query instance with the provided
   * inner join statement attached
   *
   * ```ts
   * await ApplicationModel.transaction(async txn => {
   *   await user.txn(txn).innerJoin('posts').first()
   * })
   * ```
   *
   * @param args - A chain of association names and where clauses
   * @returns A Query for this model with the inner join clause applied
   */
  public innerJoin<
    I extends DreamInstanceTransactionBuilder<DreamInstance>,
    DB extends DreamInstance['DB'],
    TableName extends DreamInstance['table'],
    Schema extends DreamInstance['schema'],
    const Arr extends readonly unknown[],
    const LastArg extends VariadicJoinsArgs<DB, Schema, TableName, Arr>,
    const JoinedAssociationsCandidate = JoinedAssociationsTypeFromAssociations<
      DB,
      Schema,
      TableName,
      [...Arr, LastArg]
    >,
    const JoinedAssociations extends
      readonly JoinedAssociation[] = JoinedAssociationsCandidate extends readonly JoinedAssociation[]
      ? JoinedAssociationsCandidate
      : never,
    RetQuery = QueryWithJoinedAssociationsType<Query<DreamInstance>, JoinedAssociations>,
  >(this: I, ...args: [...Arr, LastArg]): RetQuery {
    return this.queryInstance().innerJoin(...(args as any))
  }

  /**
   * Returns a new Query instance with the provided
   * left join statement attached
   *
   * ```ts
   * await ApplicationModel.transaction(async txn => {
   *   await user.txn(txn).leftJoin('posts').first()
   * })
   * ```
   *
   * @param args - A chain of association names and where clauses
   * @returns A Query for this model with the left join clause applied
   */
  public leftJoin<
    I extends DreamInstanceTransactionBuilder<DreamInstance>,
    DB extends DreamInstance['DB'],
    TableName extends DreamInstance['table'],
    Schema extends DreamInstance['schema'],
    const Arr extends readonly unknown[],
    const LastArg extends VariadicJoinsArgs<DB, Schema, TableName, Arr>,
    const JoinedAssociationsCandidate = JoinedAssociationsTypeFromAssociations<
      DB,
      Schema,
      TableName,
      [...Arr, LastArg]
    >,
    const JoinedAssociations extends
      readonly JoinedAssociation[] = JoinedAssociationsCandidate extends readonly JoinedAssociation[]
      ? JoinedAssociationsCandidate
      : never,
    RetQuery = QueryWithJoinedAssociationsType<Query<DreamInstance>, JoinedAssociations>,
  >(this: I, ...args: [...Arr, LastArg]): RetQuery {
    return this.queryInstance().leftJoin(...(args as any))
  }

  /**
   * Deletes the record represented by this instance
   * from the database, calling any destroy
   * hooks on this model.
   *
   * ```ts
   * const user = await User.last()
   * await ApplicationModel.transaction(async txn => {
   *   await user.txn(txn).destroy()
   * })
   * ```
   *
   * @param options - Options for destroying the instance
   * @param options.skipHooks - If true, skips applying model hooks during the destroy operation. Defaults to false
   * @param options.cascade - If false, skips destroying associations marked `dependent: 'destroy'`. Defaults to true
   * @param options.bypassAllDefaultScopes - If true, bypasses all default scopes when cascade destroying. Defaults to false
   * @param options.defaultScopesToBypass - An array of default scope names to bypass when cascade destroying. Defaults to an empty array
   * @returns The instance that was destroyed
   */
  public async destroy<I extends DreamInstanceTransactionBuilder<DreamInstance>>(
    this: I,
    options: DestroyOptions<DreamInstance> = {}
  ): Promise<DreamInstance> {
    return await destroyDream<DreamInstance>(
      this.dreamInstance,
      this.dreamTransaction,
      destroyOptions<DreamInstance>(options)
    )
  }

  /**
   * Deletes the record represented by this instance
   * from the database, calling any destroy
   * hooks on this model.
   *
   * ```ts
   * const user = await User.last()
   * await ApplicationModel.transaction(async txn => {
   *   await user.txn(txn).reallyDestroy()
   * })
   * ```
   *
   * @param options - Options for destroying the instance
   * @param options.skipHooks - If true, skips applying model hooks during the destroy operation. Defaults to false
   * @param options.cascade - If false, skips destroying associations marked `dependent: 'destroy'`. Defaults to true
   * @param options.bypassAllDefaultScopes - If true, bypasses all default scopes when cascade destroying. Defaults to false
   * @param options.defaultScopesToBypass - An array of default scope names to bypass when cascade destroying. Defaults to an empty array
   * @returns The instance that was destroyed
   */
  public async reallyDestroy<I extends DreamInstanceTransactionBuilder<DreamInstance>>(
    this: I,
    options: DestroyOptions<DreamInstance> = {}
  ): Promise<DreamInstance> {
    return await destroyDream<DreamInstance>(
      this.dreamInstance,
      this.dreamTransaction,
      reallyDestroyOptions<DreamInstance>(options)
    )
  }

  /**
   * Undestroys a SoftDelete model, unsetting
   * the `deletedAt` field in the database.
   *
   * If the model is not a SoftDelete model,
   * this will raise an exception.
   *
   * ```ts
   * const user = await User.removeAllDefaultScopes().last()
   * await user.txn(txn).undestroy()
   * ```
   *
   * @param options - Options for undestroying the instance
   * @param options.skipHooks - If true, skips applying model hooks during the undestroy operation. Defaults to false
   * @param options.cascade - If false, skips undestroying associations marked `dependent: 'destroy'`. Defaults to true
   * @param options.bypassAllDefaultScopes - If true, bypasses all default scopes when cascade undestroying. Defaults to false
   * @param options.defaultScopesToBypass - An array of default scope names to bypass when cascade undestroying (soft delete is always bypassed). Defaults to an empty array
   * @returns The undestroyed instance
   */
  public async undestroy<I extends DreamInstanceTransactionBuilder<DreamInstance>>(
    this: I,
    options: DestroyOptions<DreamInstance> = {}
  ): Promise<DreamInstance> {
    await undestroyDream(this.dreamInstance, this.dreamTransaction, undestroyOptions<DreamInstance>(options))
    await this.reload()
    return this.dreamInstance
  }

  /**
   * Applies all attribute changes passed to the Dream
   * instance, leveraging any custom-defined setters,
   * and then saves the Dream instance. Can be called
   * on an unpersisted Dream instance.
   *
   * See {@link Dream.save | save} for details on
   * the side effects of saving.
   *
   * NOTE:
   * To bypass custom-defined setters, use {@link Dream.updateAttributes | updateAttributes} instead.
   *
   * ```ts
   *  const user = await User.create({ email: 'saly@gmail.com' })
   *  await ApplicationModel.transaction(async txn => {
   *    await user.txn(txn).update({ email: 'sally@gmail.com' })
   *  })
   * ```
   *
   * @param attributes - the attributes to set on the model
   * @param opts.skipHooks - if true, will skip applying model hooks. Defaults to false
   * @returns void
   */
  public async update<I extends DreamInstanceTransactionBuilder<DreamInstance>>(
    this: I,
    attributes: UpdateableProperties<DreamInstance>,
    { skipHooks }: { skipHooks?: boolean } = {}
  ): Promise<void> {
    this.dreamInstance.assignAttributes(attributes)
    await saveDream(this.dreamInstance, this.dreamTransaction, skipHooks ? { skipHooks } : undefined)
  }

  /**
   * Applies all attribute changes passed to the dream,
   * bypassing any custom-defined setters,
   * and then saves the dream instance. Does not bypass
   * model hooks.
   *
   * See {@link Dream.save | save} for details on
   * the side effects of saving.
   *
   * NOTE:
   * To update the values without bypassing any custom-defined
   * setters, use {@link Dream.update | update} instead.
   *
   * ```ts
   * const user = await User.create({ email: 'saly@gmail.com' })
   *  await ApplicationModel.transaction(async txn => {
   *    await user.txn(txn).updateAttributes({ email: 'sally@gmail.com' })
   *  })
   * ```
   *
   * @param attributes - The attributes to update on this instance
   * @param opts.skipHooks - if true, will skip applying model hooks. Defaults to false
   * @returns - void
   */
  public async updateAttributes<I extends DreamInstanceTransactionBuilder<DreamInstance>>(
    this: I,
    attributes: UpdateableProperties<DreamInstance>,
    { skipHooks }: { skipHooks?: boolean } = {}
  ): Promise<void> {
    this.dreamInstance.setAttributes(attributes)
    await saveDream(this.dreamInstance, this.dreamTransaction, skipHooks ? { skipHooks } : undefined)
  }

  /**
   * Reloads an instance, refreshing all it's attribute values
   * to those in the database.
   *
   * NOTE: this does not refresh associations
   *
   * ```ts
   * await ApplicationModel.transaction(async txn => {
   *   await user.txn(txn).reload()
   * })
   * ```
   *
   * @returns void
   */
  public async reload<I extends DreamInstanceTransactionBuilder<DreamInstance>>(this: I): Promise<void> {
    await reload(this.dreamInstance, this.dreamTransaction)
  }

  /**
   * Saves the state of the current instance to the
   * database. For new instances (that have not been
   * persisted), `save` and `create` model hooks will be called.
   * For instances that have already been persisted,
   * the `save` and `update` model hooks will be called.
   *
   * Upon saving a new instance, the primary key, timestamp
   * fields (if defined), and `type` (if STI) will be set on
   * the model.
   *
   * Upon updating an instance, the update timestamp (if defined)
   * will be updated on the model.
   *
   * ```ts
   * const user = User.new({ email: 'how@yadoin' })
   *
   * await ApplicationModel.transaction(async txn => {
   *   user.name = 'fred'
   *   await user.txn(txn).save()
   * })
   *
   * user.email // 'how@yadoin'
   * user.name // 'fred'
   * user.id // 1
   * user.createdAt // A DateTime object
   * user.updatedAt // A DateTime object
   *
   * // If User were STI:
   * user.type // 'User'
   * ```
   *
   * @param opts.skipHooks - if true, will skip applying model hooks. Defaults to false
   * @returns void
   */
  public async save<I extends DreamInstanceTransactionBuilder<DreamInstance>>(
    this: I,
    { skipHooks }: { skipHooks?: boolean } = {}
  ): Promise<void> {
    await saveDream(this.dreamInstance, this.dreamTransaction, skipHooks ? { skipHooks } : undefined)
  }

  ///////////////////
  // associationQuery
  ///////////////////
  public associationQuery<
    I extends DreamInstanceTransactionBuilder<DreamInstance>,
    DB extends DreamInstance['DB'],
    TableName extends DreamInstance['table'],
    Schema extends DreamInstance['schema'],
    AssociationName extends DreamAssociationNames<DreamInstance>,
    RequiredOnClauseKeysForThisAssociation extends RequiredOnClauseKeys<Schema, TableName, AssociationName>,
    AssociationDream extends AssociationNameToDream<DreamInstance, AssociationName>,
    AssociationTableName extends AssociationDream['table'],
  >(
    this: I,
    associationName: AssociationName,
    joinAndStatements: JoinAndStatements<
      DB,
      Schema,
      AssociationTableName,
      RequiredOnClauseKeysForThisAssociation
    >
  ): Query<AssociationDream, DefaultQueryTypeOptions<AssociationDream, AssociationName & string>>

  public associationQuery<
    I extends DreamInstanceTransactionBuilder<DreamInstance>,
    DB extends DreamInstance['DB'],
    Schema extends DreamInstance['schema'],
    AssociationName extends DreamAssociationNamesWithoutRequiredOnClauses<DreamInstance>,
    AssociationDream extends AssociationNameToDream<DreamInstance, AssociationName>,
    AssociationTableName extends AssociationDream['table'],
  >(
    this: I,
    associationName: AssociationName,
    joinAndStatements?: JoinAndStatements<DB, Schema, AssociationTableName, null>
  ): Query<AssociationDream, DefaultQueryTypeOptions<AssociationDream, AssociationName & string>>

  /**
   * Returns a Query instance for the specified
   * association on the current instance.
   *
   * ```ts
   * await ApplicationModel.transaction(async txn => {
   *   await user.txn(txn).associationQuery('posts').all()
   *   // only user posts returned
   * })
   * ```
   *
   * @returns A Query scoped to the specified association on the current instance
   */
  public associationQuery<
    I extends DreamInstanceTransactionBuilder<DreamInstance>,
    AssociationName extends DreamAssociationNames<DreamInstance>,
  >(this: I, associationName: AssociationName, joinAndStatements?: unknown): unknown {
    if (this.dreamInstance.isNewRecord)
      throw new CannotAssociationQueryOnUnpersistedDream(this.dreamInstance, associationName)

    return associationQuery(this.dreamInstance, this.dreamTransaction, associationName, {
      joinAndStatements: joinAndStatements as any,
      bypassAllDefaultScopes: DEFAULT_BYPASS_ALL_DEFAULT_SCOPES,
      defaultScopesToBypass: DEFAULT_DEFAULT_SCOPES_TO_BYPASS,
    })
  }
  ///////////////////
  // end: associationQuery
  ///////////////////

  ///////////////////
  // updateAssociation
  ///////////////////
  public async updateAssociation<
    I extends DreamInstanceTransactionBuilder<DreamInstance>,
    DB extends DreamInstance['DB'],
    TableName extends DreamInstance['table'],
    Schema extends DreamInstance['schema'],
    AssociationName extends DreamAssociationNames<DreamInstance>,
    RequiredOnClauseKeysForThisAssociation extends RequiredOnClauseKeys<Schema, TableName, AssociationName>,
    AssociationDream extends AssociationNameToDream<DreamInstance, AssociationName>,
    AssociationTableName extends AssociationDream['table'],
  >(
    this: I,
    associationName: AssociationName,
    attributes: Partial<DreamAttributes<AssociationNameToDream<DreamInstance, AssociationName>>>,
    updateAssociationOptions: {
      bypassAllDefaultScopes?: boolean
      defaultScopesToBypass?: AllDefaultScopeNames<DreamInstance>[]
      skipHooks?: boolean
    } & JoinAndStatements<DB, Schema, AssociationTableName, RequiredOnClauseKeysForThisAssociation>
  ): Promise<number>

  public async updateAssociation<
    I extends DreamInstanceTransactionBuilder<DreamInstance>,
    DB extends DreamInstance['DB'],
    Schema extends DreamInstance['schema'],
    AssociationName extends DreamAssociationNamesWithoutRequiredOnClauses<DreamInstance>,
    AssociationDream extends AssociationNameToDream<DreamInstance, AssociationName>,
    AssociationTableName extends AssociationDream['table'],
  >(
    this: I,
    associationName: AssociationName,
    attributes: Partial<DreamAttributes<AssociationNameToDream<DreamInstance, AssociationName>>>,
    updateAssociationOptions?: {
      bypassAllDefaultScopes?: boolean
      defaultScopesToBypass?: AllDefaultScopeNames<DreamInstance>[]
      skipHooks?: boolean
    } & JoinAndStatements<DB, Schema, AssociationTableName, null>
  ): Promise<number>

  /**
   * Updates all records matching the association with
   * the provided attributes. If a where statement is passed,
   * The where statement will be applied to the query
   * before updating.
   *
   * ```ts
   * await ApplicationModel.transaction(async txn => {
   *   await user.txn(txn).createAssociation('posts', { body: 'hello world' })
   *   await user.txn(txn).createAssociation('posts', { body: 'howyadoin' })
   *   await user.txn(txn).updateAssociation('posts', { body: 'goodbye world' }, { and: { body: 'hello world' }})
   *   // 1
   * })
   * ```
   *
   * @param associationName - The name of the association to update
   * @param attributes - The attributes to update on the association
   * @param updateAssociationOptions - Options for updating the association
   * @param updateAssociationOptions.where - Optional where statement to apply to query before updating
   * @param updateAssociationOptions.bypassAllDefaultScopes - If true, bypasses all default scopes when updating the association. Defaults to false
   * @param updateAssociationOptions.defaultScopesToBypass - An array of default scope names to bypass when updating the association. Defaults to an empty array
   * @param updateAssociationOptions.skipHooks - If true, skips applying model hooks during the update operation. Defaults to false
   * @returns The number of updated records
   */
  public async updateAssociation<
    I extends DreamInstanceTransactionBuilder<DreamInstance>,
    AssociationName extends DreamAssociationNames<DreamInstance>,
  >(
    this: I,
    associationName: AssociationName,
    attributes: Partial<DreamAttributes<AssociationNameToDream<DreamInstance, AssociationName>>>,
    updateAssociationOptions: unknown
  ): Promise<number> {
    if (this.dreamInstance.isNewRecord)
      throw new CannotUpdateAssociationOnUnpersistedDream(this.dreamInstance, associationName)

    return await associationUpdateQuery(this.dreamInstance, this.dreamTransaction, associationName, {
      joinAndStatements: {
        and: (updateAssociationOptions as any)?.and,
        andNot: (updateAssociationOptions as any)?.andNot,
        andAny: (updateAssociationOptions as any)?.andAny,
      },

      bypassAllDefaultScopes:
        (updateAssociationOptions as any)?.bypassAllDefaultScopes ?? DEFAULT_BYPASS_ALL_DEFAULT_SCOPES,
      defaultScopesToBypass:
        (updateAssociationOptions as any)?.defaultScopesToBypass ?? DEFAULT_DEFAULT_SCOPES_TO_BYPASS,
    }).update(attributes, { skipHooks: (updateAssociationOptions as any)?.skipHooks ?? DEFAULT_SKIP_HOOKS })
  }

  /**
   * Creates an association for an instance. Automatically
   * handles setting foreign key and, in the case of polymorphism,
   * foreign key type.
   *
   * ```ts
   * await ApplicationModel.transaction(async txn => {
   *   await user.txn(txn).createAssociation('posts', { body: 'hello world' })
   * })
   * ```
   *
   * @param associationName - The name of the association to create
   * @param attributes - The attributes with which to create the associated model
   * @returns The created association
   */
  public async createAssociation<
    I extends DreamInstanceTransactionBuilder<DreamInstance>,
    AssociationName extends DreamAssociationNames<DreamInstance>,
    PossibleArrayAssociationType = DreamInstance[AssociationName & keyof DreamInstance],
    AssociationType = PossibleArrayAssociationType extends (infer ElementType)[]
      ? ElementType
      : PossibleArrayAssociationType,
    RestrictedAssociationType extends AssociationType extends Dream
      ? AssociationType
      : never = AssociationType extends Dream ? AssociationType : never,
  >(
    this: I,
    associationName: AssociationName,
    opts: UpdateableAssociationProperties<DreamInstance, RestrictedAssociationType> = {} as any
  ): Promise<NonNullable<AssociationType>> {
    if (this.dreamInstance.isNewRecord)
      throw new CannotCreateAssociationOnUnpersistedDream(this.dreamInstance, associationName)

    return await createAssociation(this.dreamInstance, this.dreamTransaction, associationName, opts)
  }

  ///////////////////
  // destroyAssociation
  ///////////////////
  public async destroyAssociation<
    I extends DreamInstanceTransactionBuilder<DreamInstance>,
    DB extends DreamInstance['DB'],
    TableName extends DreamInstance['table'],
    Schema extends DreamInstance['schema'],
    AssociationName extends DreamAssociationNames<DreamInstance>,
    RequiredOnClauseKeysForThisAssociation extends RequiredOnClauseKeys<Schema, TableName, AssociationName>,
    AssociationDream extends AssociationNameToDream<DreamInstance, AssociationName>,
    AssociationTableName extends AssociationDream['table'],
  >(
    this: I,
    associationName: AssociationName,
    options: DestroyOptions<DreamInstance> &
      JoinAndStatements<DB, Schema, AssociationTableName, RequiredOnClauseKeysForThisAssociation>
  ): Promise<number>

  public async destroyAssociation<
    I extends DreamInstanceTransactionBuilder<DreamInstance>,
    DB extends DreamInstance['DB'],
    Schema extends DreamInstance['schema'],
    AssociationName extends DreamAssociationNamesWithoutRequiredOnClauses<DreamInstance>,
    AssociationDream extends AssociationNameToDream<DreamInstance, AssociationName>,
    AssociationTableName extends AssociationDream['table'],
  >(
    this: I,
    associationName: AssociationName,
    options?: DestroyOptions<DreamInstance> & JoinAndStatements<DB, Schema, AssociationTableName, null>
  ): Promise<number>

  /**
   * Destroys models associated with the current instance,
   * deleting their corresponding records within the database.
   *
   * ```ts
   * await ApplicationModel.transaction(async txn => {
   *   await user.txn(txn).destroyAssociation('posts', { and: { body: 'hello world' } })
   * })
   * ```
   *
   * @param associationName - The name of the association to destroy
   * @param options - Options for destroying the association
   * @param options.and - Optional and statement to apply to query before destroying
   * @param options.andNot - Optional andNot statement to apply to query before destroying
   * @param options.andAny - Optional andAny statement to apply to query before destroying
   * @param options.skipHooks - If true, skips applying model hooks during the destroy operation. Defaults to false
   * @param options.cascade - If false, skips destroying associations marked `dependent: 'destroy'`. Defaults to true
   * @param options.bypassAllDefaultScopes - If true, bypasses all default scopes when destroying the association. Defaults to false
   * @param options.defaultScopesToBypass - An array of default scope names to bypass when destroying the association. Defaults to an empty array
   * @returns The number of records deleted
   */
  public async destroyAssociation<
    I extends DreamInstanceTransactionBuilder<DreamInstance>,
    AssociationName extends DreamAssociationNames<DreamInstance>,
  >(this: I, associationName: AssociationName, options?: unknown): Promise<number> {
    if (this.dreamInstance.isNewRecord)
      throw new CannotDestroyAssociationOnUnpersistedDream(this.dreamInstance, associationName)

    return await destroyAssociation(this.dreamInstance, this.dreamTransaction, associationName, {
      ...destroyOptions<DreamInstance>(options as any),
      joinAndStatements: {
        and: (options as any)?.and,
        andNot: (options as any)?.andNot,
        andAny: (options as any)?.andAny,
      },
    })
  }
  //////////////////////////
  // end: destroyAssociation
  //////////////////////////

  ///////////////////////////
  // reallyDestroyAssociation
  ///////////////////////////
  public async reallyDestroyAssociation<
    I extends DreamInstanceTransactionBuilder<DreamInstance>,
    DB extends DreamInstance['DB'],
    TableName extends DreamInstance['table'],
    Schema extends DreamInstance['schema'],
    AssociationName extends DreamAssociationNames<DreamInstance>,
    RequiredOnClauseKeysForThisAssociation extends RequiredOnClauseKeys<Schema, TableName, AssociationName>,
    AssociationDream extends AssociationNameToDream<DreamInstance, AssociationName>,
    AssociationTableName extends AssociationDream['table'],
  >(
    this: I,
    associationName: AssociationName,
    options: DestroyOptions<DreamInstance> &
      JoinAndStatements<DB, Schema, AssociationTableName, RequiredOnClauseKeysForThisAssociation>
  ): Promise<number>

  public async reallyDestroyAssociation<
    I extends DreamInstanceTransactionBuilder<DreamInstance>,
    DB extends DreamInstance['DB'],
    Schema extends DreamInstance['schema'],
    AssociationName extends DreamAssociationNamesWithoutRequiredOnClauses<DreamInstance>,
    AssociationDream extends AssociationNameToDream<DreamInstance, AssociationName>,
    AssociationTableName extends AssociationDream['table'],
  >(
    this: I,
    associationName: AssociationName,
    options?: DestroyOptions<DreamInstance> & JoinAndStatements<DB, Schema, AssociationTableName, null>
  ): Promise<number>

  /**
   * Destroys models associated with the current instance,
   * deleting their corresponding records within the database.
   *
   * If the record, or else any of its associations
   * which are marked cascade: "destroy", are using
   * the SoftDelete decorator, it will be bypassed,
   * causing those records to be deleted from the database.
   *
   * ```ts
   * await ApplicationModel.transaction(async txn => {
   *   await user.txn(txn).reallyDestroyAssociation('posts', { and: { body: 'hello world' } })
   * })
   * ```
   *
   * @param associationName - The name of the association to destroy
   * @param options - Options for destroying the association
   * @param options.and - Optional and statement to apply to query before destroying
   * @param options.andNot - Optional andNot statement to apply to query before destroying
   * @param options.andAny - Optional andAny statement to apply to query before destroying
   * @param options.skipHooks - If true, skips applying model hooks during the destroy operation. Defaults to false
   * @param options.cascade - If true, cascades the destroy operation to associations marked with `dependent: 'destroy'`. Defaults to true
   * @param options.bypassAllDefaultScopes - If true, bypasses all default scopes when destroying the association. Defaults to false
   * @param options.defaultScopesToBypass - An array of default scope names to bypass when destroying the association. Defaults to an empty array
   * @returns The number of records deleted
   */
  public async reallyDestroyAssociation<
    I extends DreamInstanceTransactionBuilder<DreamInstance>,
    AssociationName extends DreamAssociationNames<DreamInstance>,
  >(this: I, associationName: AssociationName, options?: unknown): Promise<number> {
    if (this.dreamInstance.isNewRecord)
      throw new CannotDestroyAssociationOnUnpersistedDream(this.dreamInstance, associationName)

    return await destroyAssociation(this.dreamInstance, this.dreamTransaction, associationName, {
      ...reallyDestroyOptions<DreamInstance>(options as any),
      joinAndStatements: {
        and: (options as any)?.and,
        andNot: (options as any)?.andNot,
        andAny: (options as any)?.andAny,
      },
    })
  }
  ////////////////////////////////
  // end: reallyDestroyAssociation
  ////////////////////////////////

  ///////////////////
  // undestroyAssociation
  ///////////////////
  public async undestroyAssociation<
    I extends DreamInstanceTransactionBuilder<DreamInstance>,
    DB extends DreamInstance['DB'],
    TableName extends DreamInstance['table'],
    Schema extends DreamInstance['schema'],
    AssociationName extends DreamAssociationNames<DreamInstance>,
    RequiredOnClauseKeysForThisAssociation extends RequiredOnClauseKeys<Schema, TableName, AssociationName>,
    AssociationDream extends AssociationNameToDream<DreamInstance, AssociationName>,
    AssociationTableName extends AssociationDream['table'],
  >(
    this: I,
    associationName: AssociationName,
    options: DestroyOptions<DreamInstance> &
      JoinAndStatements<DB, Schema, AssociationTableName, RequiredOnClauseKeysForThisAssociation>
  ): Promise<number>

  public async undestroyAssociation<
    I extends DreamInstanceTransactionBuilder<DreamInstance>,
    DB extends DreamInstance['DB'],
    Schema extends DreamInstance['schema'],
    AssociationName extends DreamAssociationNamesWithoutRequiredOnClauses<DreamInstance>,
    AssociationDream extends AssociationNameToDream<DreamInstance, AssociationName>,
    AssociationTableName extends AssociationDream['table'],
  >(
    this: I,
    associationName: AssociationName,
    options?: DestroyOptions<DreamInstance> & JoinAndStatements<DB, Schema, AssociationTableName, null>
  ): Promise<number>

  /**
   * Undestroys a SoftDelete association.
   * If cascade: true is passed, any child
   * associations that have been soft deleted
   * will also be undeleted.
   *
   * ```ts
   * await user.undestroyAssociation('posts', { and: { body: 'hello world' } })
   * ```
   *
   * @param associationName - The name of the association to undestroy
   * @param options - Options for undestroying the association
   * @param options.and - Optional and statement to apply to query before undestroying
   * @param options.andNot - Optional andNot statement to apply to query before undestroying
   * @param options.andAny - Optional andAny statement to apply to query before undestroying
   * @param options.skipHooks - If true, skips applying model hooks during the undestroy operation. Defaults to false
   * @param options.cascade - If false, skips undestroying associations marked `dependent: 'destroy'`. Defaults to true
   * @param options.bypassAllDefaultScopes - If true, bypasses all default scopes when undestroying the association. Defaults to false
   * @param options.defaultScopesToBypass - An array of default scope names to bypass when undestroying the association. Defaults to an empty array
   * @returns The number of records undestroyed
   */
  public async undestroyAssociation<
    I extends DreamInstanceTransactionBuilder<DreamInstance>,
    AssociationName extends DreamAssociationNames<DreamInstance>,
  >(this: I, associationName: AssociationName, options?: unknown): Promise<number> {
    return await undestroyAssociation(this.dreamInstance, this.dreamTransaction, associationName, {
      ...undestroyOptions<DreamInstance>(options as any),
      joinAndStatements: {
        and: (options as any)?.and,
        andNot: (options as any)?.andNot,
        andAny: (options as any)?.andAny,
      },
    })
  }
  ///////////////////
  // end: undestroyAssociation
  ///////////////////

  /**
   * @internal
   *
   * returns a query instance, scoped to the current
   * dream instance with primary key where statement
   * automatically applied.
   */
  private queryInstance<I extends DreamInstanceTransactionBuilder<DreamInstance>>(
    this: I
  ): Query<DreamInstance> {
    const dreamClass = this.dreamInstance.constructor as DreamConstructorType<DreamInstance>
    const id = this.dreamInstance.primaryKeyValue()

    return dreamClass.txn(this.dreamTransaction).where({ [this.dreamInstance['_primaryKey']]: id } as any)
  }
}
