import { WhereStatementForAssociation } from '../decorators/associations/shared'
import Dream from '../Dream'
import DreamTransaction from './DreamTransaction'
import associationQuery from './internal/associations/associationQuery'
import associationUpdateQuery from './internal/associations/associationUpdateQuery'
import createAssociation from './internal/associations/createAssociation'
import destroyAssociation from './internal/associations/destroyAssociation'
import undestroyAssociation from './internal/associations/undestroyAssociation'
import destroyDream from './internal/destroyDream'
import {
  destroyOptions,
  DestroyOptions,
  reallyDestroyOptions,
  undestroyOptions,
} from './internal/destroyOptions'
import reload from './internal/reload'
import saveDream from './internal/saveDream'
import {
  DEFAULT_BYPASS_ALL_DEFAULT_SCOPES,
  DEFAULT_DEFAULT_SCOPES_TO_BYPASS,
  DEFAULT_SKIP_HOOKS,
} from './internal/scopeHelpers'
import undestroyDream from './internal/undestroyDream'
import LeftJoinLoadBuilder from './LeftJoinLoadBuilder'
import LoadBuilder from './LoadBuilder'
import Query, { DefaultQueryTypeOptions, QueryWithJoinedAssociationsType } from './Query'
import {
  AllDefaultScopeNames,
  AssociationNameToDream,
  DreamAssociationNames,
  DreamAssociationNamesWithoutRequiredWhereClauses,
  DreamAttributes,
  DreamConstructorType,
  JoinedAssociationsTypeFromAssociations,
  UpdateableAssociationProperties,
  UpdateableProperties,
  VariadicJoinsArgs,
  VariadicLeftJoinLoadArgs,
  VariadicLoadArgs,
} from './types'

export default class DreamInstanceTransactionBuilder<DreamInstance extends Dream> {
  public dreamInstance: DreamInstance
  public dreamTransaction: DreamTransaction<Dream>

  /**
   * Constructs a new DreamInstanceTransactionBuilder.
   *
   * @param dreamInstance - The Dream instance to build the transaction for
   * @param txn - The DreamTransaction instance
   */
  constructor(dreamInstance: DreamInstance, txn: DreamTransaction<Dream>) {
    this.dreamInstance = dreamInstance
    this.dreamTransaction = txn
  }

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
    LastArg extends VariadicJoinsArgs<DB, Schema, TableName, Arr>,
  >(this: I, ...args: [...Arr, LastArg]) {
    return this.queryInstance().innerJoin(...(args as any)) as QueryWithJoinedAssociationsType<
      DreamInstance,
      JoinedAssociationsTypeFromAssociations<DB, Schema, TableName, [...Arr, LastArg]>
    >
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
    LastArg extends VariadicJoinsArgs<DB, Schema, TableName, Arr>,
  >(this: I, ...args: [...Arr, LastArg]) {
    return this.queryInstance().leftJoin(...(args as any)) as QueryWithJoinedAssociationsType<
      DreamInstance,
      JoinedAssociationsTypeFromAssociations<DB, Schema, TableName, [...Arr, LastArg]>
    >
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
    await saveDream(this.dreamInstance, this.dreamTransaction, { skipHooks })
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
    await saveDream(this.dreamInstance, this.dreamTransaction, { skipHooks })
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
    await saveDream(this.dreamInstance, this.dreamTransaction, { skipHooks })
  }

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
    AssociationDream extends AssociationNameToDream<DreamInstance, AssociationName>,
  >(
    this: I,
    associationName: AssociationName
  ): Query<AssociationDream, DefaultQueryTypeOptions<AssociationDream, AssociationName & string>> {
    return associationQuery(this.dreamInstance, this.dreamTransaction, associationName, {
      bypassAllDefaultScopes: DEFAULT_BYPASS_ALL_DEFAULT_SCOPES,
      defaultScopesToBypass: DEFAULT_DEFAULT_SCOPES_TO_BYPASS,
    })
  }

  ///////////////////
  // updateAssociation
  ///////////////////
  public async updateAssociation<
    I extends DreamInstanceTransactionBuilder<DreamInstance>,
    DB extends DreamInstance['DB'],
    TableName extends DreamInstance['table'],
    Schema extends DreamInstance['schema'],
    AssociationName extends DreamAssociationNames<DreamInstance>,
  >(
    this: I,
    associationName: AssociationName,
    attributes: Partial<DreamAttributes<AssociationNameToDream<DreamInstance, AssociationName>>>,
    updateAssociationOptions: {
      bypassAllDefaultScopes?: boolean
      defaultScopesToBypass?: AllDefaultScopeNames<DreamInstance>[]
      cascade?: boolean
      skipHooks?: boolean
      where: WhereStatementForAssociation<DB, Schema, TableName, AssociationName>
    }
  ): Promise<number>

  public async updateAssociation<
    I extends DreamInstanceTransactionBuilder<DreamInstance>,
    DB extends DreamInstance['DB'],
    TableName extends DreamInstance['table'],
    Schema extends DreamInstance['schema'],
    AssociationName extends DreamAssociationNamesWithoutRequiredWhereClauses<DreamInstance>,
  >(
    this: I,
    associationName: AssociationName,
    attributes: Partial<DreamAttributes<AssociationNameToDream<DreamInstance, AssociationName>>>,
    updateAssociationOptions?: {
      bypassAllDefaultScopes?: boolean
      defaultScopesToBypass?: AllDefaultScopeNames<DreamInstance>[]
      cascade?: boolean
      skipHooks?: boolean
      where?: WhereStatementForAssociation<DB, Schema, TableName, AssociationName>
    }
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
   *   await user.txn(txn).updateAssociation('posts', { body: 'goodbye world' }, { where: { body: 'hello world' }})
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
    return await associationUpdateQuery(this.dreamInstance, this.dreamTransaction, associationName, {
      associationWhereStatement: (updateAssociationOptions as any)?.where,
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
    return await createAssociation(this.dreamInstance, this.dreamTransaction, associationName, opts)
  }

  ///////////////////
  // destroyAssociation
  ///////////////////
  public async destroyAssociation<
    I extends DreamInstanceTransactionBuilder<DreamInstance>,
    AssociationName extends DreamAssociationNames<DreamInstance>,
    DB extends DreamInstance['DB'],
    TableName extends DreamInstance['table'],
    Schema extends DreamInstance['schema'],
  >(
    this: I,
    associationName: AssociationName,
    options: DestroyOptions<DreamInstance> & {
      where: WhereStatementForAssociation<DB, Schema, TableName, AssociationName>
    }
  ): Promise<number>

  public async destroyAssociation<
    I extends DreamInstanceTransactionBuilder<DreamInstance>,
    AssociationName extends DreamAssociationNamesWithoutRequiredWhereClauses<DreamInstance>,
    DB extends DreamInstance['DB'],
    TableName extends DreamInstance['table'],
    Schema extends DreamInstance['schema'],
  >(
    this: I,
    associationName: AssociationName,
    options?: DestroyOptions<DreamInstance> & {
      where?: WhereStatementForAssociation<DB, Schema, TableName, AssociationName>
    }
  ): Promise<number>

  /**
   * Destroys models associated with the current instance,
   * deleting their corresponding records within the database.
   *
   * ```ts
   * await ApplicationModel.transaction(async txn => {
   *   await user.txn(txn).destroyAssociation('posts', { where: { body: 'hello world' } })
   * })
   * ```
   *
   * @param associationName - The name of the association to destroy
   * @param options - Options for destroying the association
   * @param options.where - Optional where statement to apply to query before destroying
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
    return await destroyAssociation(this.dreamInstance, this.dreamTransaction, associationName, {
      ...destroyOptions<DreamInstance>(options as any),
      associationWhereStatement: (options as any)?.where,
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
    AssociationName extends DreamAssociationNames<DreamInstance>,
    DB extends DreamInstance['DB'],
    TableName extends DreamInstance['table'],
    Schema extends DreamInstance['schema'],
  >(
    this: I,
    associationName: AssociationName,
    options: DestroyOptions<DreamInstance> & {
      where: WhereStatementForAssociation<DB, Schema, TableName, AssociationName>
    }
  ): Promise<number>

  public async reallyDestroyAssociation<
    I extends DreamInstanceTransactionBuilder<DreamInstance>,
    AssociationName extends DreamAssociationNamesWithoutRequiredWhereClauses<DreamInstance>,
    DB extends DreamInstance['DB'],
    TableName extends DreamInstance['table'],
    Schema extends DreamInstance['schema'],
  >(
    this: I,
    associationName: AssociationName,
    options?: DestroyOptions<DreamInstance> & {
      where?: WhereStatementForAssociation<DB, Schema, TableName, AssociationName>
    }
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
   *   await user.txn(txn).reallyDestroyAssociation('posts', { where: { body: 'hello world' } })
   * })
   * ```
   *
   * @param associationName - The name of the association to destroy
   * @param options - Options for destroying the association
   * @param options.where - Optional where statement to apply to query before destroying
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
    return await destroyAssociation(this.dreamInstance, this.dreamTransaction, associationName, {
      ...reallyDestroyOptions<DreamInstance>(options as any),
      associationWhereStatement: (options as any)?.where,
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
  >(
    this: I,
    associationName: AssociationName,
    options: DestroyOptions<DreamInstance> & {
      where: WhereStatementForAssociation<DB, Schema, TableName, AssociationName>
    }
  ): Promise<number>

  public async undestroyAssociation<
    I extends DreamInstanceTransactionBuilder<DreamInstance>,
    DB extends DreamInstance['DB'],
    TableName extends DreamInstance['table'],
    Schema extends DreamInstance['schema'],
    AssociationName extends DreamAssociationNamesWithoutRequiredWhereClauses<DreamInstance>,
  >(
    this: I,
    associationName: AssociationName,
    options?: DestroyOptions<DreamInstance> & {
      where?: WhereStatementForAssociation<DB, Schema, TableName, AssociationName>
    }
  ): Promise<number>

  /**
   * Undestroys a SoftDelete association.
   * If cascade: true is passed, any child
   * associations that have been soft deleted
   * will also be undeleted.
   *
   * ```ts
   * await user.undestroyAssociation('posts', { where: { body: 'hello world' } })
   * ```
   *
   * @param associationName - The name of the association to undestroy
   * @param options - Options for undestroying the association
   * @param options.where - Optional where statement to apply to query before undestroying
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
      associationWhereStatement: (options as any)?.where,
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
  ): Query<DreamInstance, DefaultQueryTypeOptions<DreamInstance>> {
    const dreamClass = this.dreamInstance.constructor as DreamConstructorType<DreamInstance>
    const id = this.dreamInstance.primaryKeyValue

    return dreamClass.txn(this.dreamTransaction).where({ [this.dreamInstance.primaryKey]: id } as any)
  }
}
