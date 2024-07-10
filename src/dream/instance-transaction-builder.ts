import { WhereStatementForAssociation } from '../decorators/associations/shared'
import Dream from '../dream'
import associationQuery from './internal/associations/associationQuery'
import associationUpdateQuery from './internal/associations/associationUpdateQuery'
import createAssociation from './internal/associations/createAssociation'
import destroyAssociation from './internal/associations/destroyAssociation'
import undestroyAssociation from './internal/associations/undestroyAssociation'
import destroyDream from './internal/destroyDream'
import reload from './internal/reload'
import saveDream from './internal/saveDream'
import undestroyDream from './internal/undestroyDream'
import LoadBuilder from './load-builder'
import Query from './query'
import DreamTransaction from './transaction'
import {
  DreamAssociationNamesWithRequiredWhereClauses,
  DreamAssociationNamesWithoutRequiredWhereClauses,
  DreamAssociationType,
  DreamAttributes,
  DreamConstructorType,
  FinalVariadicTableName,
  TableColumnType,
  UpdateableAssociationProperties,
  UpdateableProperties,
  VariadicCountThroughArgs,
  VariadicLoadArgs,
  VariadicMinMaxThroughArgs,
  VariadicPluckEachThroughArgs,
  VariadicPluckThroughArgs,
} from './types'

export default class DreamInstanceTransactionBuilder<DreamInstance extends Dream> {
  public dreamInstance: DreamInstance
  public dreamTransaction: DreamTransaction<Dream>

  constructor(dreamInstance: DreamInstance, txn: DreamTransaction<Dream>) {
    this.dreamInstance = dreamInstance
    this.dreamTransaction = txn
  }

  /**
   * Plucks the specified fields from the join Query,
   * scoping the query to the model instance's primary
   * key.
   *
   * ```ts
   *
   * await ApplicationModel.transaction(async txn => {
   *   const user = await User.txn(txn).first()
   *   await user.txn(txn).pluckThrough(
   *     'posts',
   *     { createdAt: range(CalendarDate.yesterday()) },
   *     'comments',
   *     'replies',
   *     'replies.body'
   *   )
   * })
   * // ['loved it!', 'hated it :(']
   * ```
   *
   * If more than one column is requested, a multi-dimensional
   * array is returned:
   *
   * ```ts
   * await ApplicationModel.transaction(async txn => {
   *   const user = await User.txn(txn).first()
   *   await user.txn(txn).pluckThrough(
   *     'posts',
   *     { createdAt: range(CalendarDate.yesterday()) },
   *     'comments',
   *     'replies',
   *     ['replies.body', 'replies.numLikes']
   *   )
   * })
   * // [['loved it!', 1], ['hated it :(', 3]]
   * ```
   *
   * @param args - A chain of association names and where clauses ending with the column or array of columns to pluck
   * @returns An array of pluck results
   */
  public async pluckThrough<
    I extends DreamInstanceTransactionBuilder<DreamInstance>,
    DB extends DreamInstance['dreamconf']['DB'],
    TableName extends DreamInstance['table'],
    Schema extends DreamInstance['dreamconf']['schema'],
    const Arr extends readonly unknown[],
  >(this: I, ...args: [...Arr, VariadicPluckThroughArgs<DB, Schema, TableName, Arr>]): Promise<any[]> {
    return this.queryInstance().pluckThrough(...(args as any))
  }

  /**
   * Plucks the specified fields from the join Query in batches,
   * passing each plucked value/set of plucked values
   * into the provided callback function. It will continue
   * doing this until it exhausts all results in the
   * Query. This is useful when plucking would result in
   * more results than would be desirable to instantiate
   * in memory/more results than would be desirable to handle
   * between awaits.
   *
   * ```ts
   * const user = await User.first()
   *
   * await ApplicationModel.transaction(async txn => {
   *   await user.txn(txn).pluckEachThrough(
   *     'posts',
   *     { createdAt: range(CalendarDate.yesterday()) },
   *     'comments',
   *     'replies',
   *     ['replies.body', 'replies.numLikes'],
   *     ([body, numLikes]) => {
   *       console.log({ body, numLikes })
   *     }
   *   )
   *
   *   // { body: 'loved it!', numLikes: 2 }
   *   // { body: 'hated it :(', numLikes: 0 }
   *   })
   * ```
   *
   * @param args - A chain of association names and where clauses ending with the column or array of columns to pluck and the callback function
   * @returns void
   */
  public async pluckEachThrough<
    I extends DreamInstanceTransactionBuilder<DreamInstance>,
    DB extends DreamInstance['dreamconf']['DB'],
    Schema extends DreamInstance['dreamconf']['schema'],
    TableName extends DreamInstance['table'],
    const Arr extends readonly unknown[],
  >(this: I, ...args: [...Arr, VariadicPluckEachThroughArgs<DB, Schema, TableName, Arr>]) {
    return this.queryInstance().pluckEachThrough(...(args as any))
  }

  /**
   * Join through associations, with optional where clauses,
   * and return the minimum value for the specified column
   *
   * ```ts
   * await ApplicationModel.transaction(async txn => {
   *   const firstPostId = await user.txn(txn).minThrough('posts', { createdAt: range(start) }, 'posts.rating')
   * })
   * // 2.5
   * ```
   *
   * @param args - A chain of association names and where clauses ending with the column to min
   * @returns the min value of the specified column for the nested association's records
   */
  public async minThrough<
    I extends DreamInstanceTransactionBuilder<DreamInstance>,
    DB extends DreamInstance['dreamconf']['DB'],
    Schema extends DreamInstance['dreamconf']['schema'],
    TableName extends DreamInstance['table'],
    const Arr extends readonly unknown[],
    FinalColumnWithAlias extends VariadicMinMaxThroughArgs<DB, Schema, TableName, Arr>,
    FinalColumn extends FinalColumnWithAlias extends Readonly<`${string}.${infer R extends Readonly<string>}`>
      ? R
      : never,
    FinalTableName extends FinalVariadicTableName<DB, Schema, TableName, Arr>,
    FinalColumnType extends TableColumnType<Schema, FinalTableName, FinalColumn>,
  >(this: I, ...args: [...Arr, FinalColumnWithAlias]): Promise<FinalColumnType> {
    return (await this.queryInstance().minThrough(...(args as any))) as FinalColumnType
  }

  /**
   * Join through associations, with optional where clauses,
   * and return the maximum value for the specified column
   *
   * ```ts
   * await ApplicationModel.transaction(async txn => {
   *   const firstPostId = await user.txn(txn).maxThrough('posts', { createdAt: range(start) }, 'posts.rating')
   * })
   * // 4.8
   * ```
   *
   * @param args - A chain of association names and where clauses ending with the column to max
   * @returns the max value of the specified column for the nested association's records
   */
  public async maxThrough<
    I extends DreamInstanceTransactionBuilder<DreamInstance>,
    DB extends DreamInstance['dreamconf']['DB'],
    Schema extends DreamInstance['dreamconf']['schema'],
    TableName extends DreamInstance['table'],
    const Arr extends readonly unknown[],
    FinalColumnWithAlias extends VariadicMinMaxThroughArgs<DB, Schema, TableName, Arr>,
    FinalColumn extends FinalColumnWithAlias extends Readonly<`${string}.${infer R extends Readonly<string>}`>
      ? R
      : never,
    FinalTableName extends FinalVariadicTableName<DB, Schema, TableName, Arr>,
    FinalColumnType extends TableColumnType<Schema, FinalTableName, FinalColumn>,
  >(this: I, ...args: [...Arr, FinalColumnWithAlias]): Promise<FinalColumnType> {
    return (await this.queryInstance().maxThrough(...(args as any))) as FinalColumnType
  }

  /**
   * Retrieves the number of records matching
   * the given query.
   *
   * ```ts
   * await ApplicationModel.transaction(async txn => {
   *   await user.txn(txn).where({ email: null }).countThrough('posts', 'comments', { body: null })
   *   // 42
   * })
   * ```
   *
   * @param args - A chain of association names and where clauses
   * @returns the number of records found matching the given parameters
   */
  public async countThrough<
    DB extends DreamInstance['dreamconf']['DB'],
    Schema extends DreamInstance['dreamconf']['schema'],
    TableName extends DreamInstance['table'],
    const Arr extends readonly unknown[],
  >(...args: [...Arr, VariadicCountThroughArgs<DB, Schema, TableName, Arr>]): Promise<number> {
    return await this.queryInstance().countThrough(...(args as any))
  }

  /**
   * Loads the requested associations upon execution
   *
   * NOTE: Preload is often a preferrable way of achieving the
   * same goal.
   *
   * ```ts
   * await ApplicationModel.transaction(async txn => {
   *   await user
   *    .txn(txn)
   *    .load('posts', { body: ops.ilike('%hello world%') }, 'comments', 'replies')
   *    .load('images')
   *    .execute()
   *
   *   user.posts[0].comments[0].replies[0]
   *   // Reply{}
   *
   *   user.images[0]
   *   // Image{}
   * })
   * ```
   *
   * @param args - A list of associations (and optional where clauses) to load
   * @returns A chainable LoadBuilder instance
   */
  public load<
    I extends DreamInstanceTransactionBuilder<DreamInstance>,
    DB extends DreamInstance['dreamconf']['DB'],
    TableName extends DreamInstance['table'],
    Schema extends DreamInstance['dreamconf']['schema'],
    const Arr extends readonly unknown[],
  >(this: I, ...args: [...Arr, VariadicLoadArgs<DB, Schema, TableName, Arr>]): LoadBuilder<DreamInstance> {
    return new LoadBuilder<DreamInstance>(this.dreamInstance, this.dreamTransaction).load(...(args as any))
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
   * @param opts.skipHooks - if true, will skip applying model hooks. Defaults to false
   * @param opts.cascade - if false, will skip applying cascade deletes on "dependent: 'destroy'" associations. Defaults to true
   * @returns the instance that was destroyed
   */
  public async destroy<I extends DreamInstanceTransactionBuilder<DreamInstance>>(
    this: I,
    { skipHooks, cascade }: { skipHooks?: boolean; cascade?: boolean } = {}
  ): Promise<DreamInstance> {
    return destroyDream<DreamInstance>(this.dreamInstance, this.dreamTransaction, { skipHooks, cascade })
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
   * @param opts.skipHooks - if true, will skip applying model hooks. Defaults to false
   * @param opts.cascade - if false, will skip applying cascade deletes on "dependent: 'destroy'" associations. Defaults to true
   * @returns the instance that was destroyed
   */
  public async reallyDestroy<I extends DreamInstanceTransactionBuilder<DreamInstance>>(
    this: I,
    { skipHooks, cascade }: { skipHooks?: boolean; cascade?: boolean } = {}
  ): Promise<DreamInstance> {
    return destroyDream<DreamInstance>(this.dreamInstance, this.dreamTransaction, {
      skipHooks,
      cascade,
      reallyDestroy: true,
    })
  }

  /**
   * Undestroys a SoftDelete model, unsetting
   * the `deletedAt` field in the database.
   *
   * If the model is not a SoftDelete model,
   * this will raise an exception.
   *
   * ```ts
   * const user = await User.unscoped().last()
   * await user.undestroy()
   * // 12
   * ```
   *
   * @returns The number of records that were removed
   */
  public async undestroy<I extends DreamInstanceTransactionBuilder<DreamInstance>>(
    this: I,
    { skipHooks, cascade }: { skipHooks?: boolean; cascade?: boolean } = {}
  ): Promise<I> {
    await undestroyDream(this.dreamInstance, this.dreamTransaction, { skipHooks, cascade })
    await this.reload()
    return this
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
   * @returns - void
   */
  public async updateAttributes<I extends DreamInstanceTransactionBuilder<DreamInstance>>(
    this: I,
    attributes: UpdateableProperties<DreamInstance>
  ): Promise<void> {
    this.dreamInstance.setAttributes(attributes)
    await saveDream(this.dreamInstance, this.dreamTransaction)
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
  public async save<I extends DreamInstanceTransactionBuilder<DreamInstance>>(this: I): Promise<void> {
    await saveDream(this.dreamInstance, this.dreamTransaction)
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
    AssociationName extends
      keyof DreamInstance['dreamconf']['schema'][DreamInstance['table']]['associations'],
  >(this: I, associationName: AssociationName): any {
    return associationQuery(this.dreamInstance, this.dreamTransaction, associationName)
  }

  ///////////////////
  // updateAssociation
  ///////////////////
  public async updateAssociation<
    I extends DreamInstanceTransactionBuilder<DreamInstance>,
    DB extends DreamInstance['dreamconf']['DB'],
    TableName extends DreamInstance['table'],
    Schema extends DreamInstance['dreamconf']['schema'],
    AssociationName extends keyof DreamInstance &
      DreamAssociationNamesWithRequiredWhereClauses<DreamInstance>,
  >(
    this: I,
    associationName: AssociationName,
    attributes: Partial<DreamAttributes<DreamAssociationType<DreamInstance, AssociationName>>>,
    updateAssociationOptions: {
      where: WhereStatementForAssociation<DB, Schema, TableName, AssociationName>
      skipHooks?: boolean
    }
  ): Promise<number>

  public async updateAssociation<
    I extends DreamInstanceTransactionBuilder<DreamInstance>,
    DB extends DreamInstance['dreamconf']['DB'],
    TableName extends DreamInstance['table'],
    Schema extends DreamInstance['dreamconf']['schema'],
    AssociationName extends keyof DreamInstance &
      DreamAssociationNamesWithoutRequiredWhereClauses<DreamInstance>,
  >(
    this: I,
    associationName: AssociationName,
    attributes: Partial<DreamAttributes<DreamAssociationType<DreamInstance, AssociationName>>>,
    updateAssociationOptions?: {
      where?: WhereStatementForAssociation<DB, Schema, TableName, AssociationName>
      skipHooks?: boolean
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
   * @returns The number of updated records
   */
  public async updateAssociation<
    I extends DreamInstanceTransactionBuilder<DreamInstance>,
    AssociationName extends keyof DreamInstance,
  >(
    this: I,
    associationName: AssociationName,
    attributes: Partial<DreamAttributes<DreamAssociationType<DreamInstance, AssociationName>>>,
    updateAssociationOptions: unknown
  ): Promise<number> {
    return await associationUpdateQuery(
      this.dreamInstance,
      this.dreamTransaction,
      associationName,
      (updateAssociationOptions as any)?.where
    ).update(attributes, { skipHooks: (updateAssociationOptions as any)?.skipHooks })
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
   * @param associationName - the name of the association to create
   * @param attributes - the attributes with which to create the associated model
   * @returns The created association
   */
  public async createAssociation<
    I extends DreamInstanceTransactionBuilder<DreamInstance>,
    AssociationName extends
      keyof DreamInstance['dreamconf']['schema'][DreamInstance['table']]['associations'],
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
  public destroyAssociation<
    I extends DreamInstanceTransactionBuilder<DreamInstance>,
    AssociationName extends keyof DreamInstance &
      DreamAssociationNamesWithRequiredWhereClauses<DreamInstance>,
    DB extends DreamInstance['dreamconf']['DB'],
    TableName extends DreamInstance['table'],
    Schema extends DreamInstance['dreamconf']['schema'],
  >(
    this: I,
    associationName: AssociationName,
    destroyAssociationOptions: {
      where: WhereStatementForAssociation<DB, Schema, TableName, AssociationName>
      skipHooks?: boolean
      cascade?: boolean
    }
  ): Promise<number>

  public destroyAssociation<
    I extends DreamInstanceTransactionBuilder<DreamInstance>,
    AssociationName extends keyof DreamInstance &
      DreamAssociationNamesWithoutRequiredWhereClauses<DreamInstance>,
    DB extends DreamInstance['dreamconf']['DB'],
    TableName extends DreamInstance['table'],
    Schema extends DreamInstance['dreamconf']['schema'],
  >(
    this: I,
    associationName: AssociationName,
    destroyAssociationOptions?: {
      where?: WhereStatementForAssociation<DB, Schema, TableName, AssociationName>
      skipHooks?: boolean
      cascade?: boolean
    }
  ): Promise<number>

  /**
   * Destroys models associated with the current instance,
   * deleting their corresponding records within the database.
   *
   * ```ts
   * await ApplicationModel.transaction(async txn => {
   *   await user.txn(txn).destroyAssociation('posts', { body: 'hello world' })
   * })
   * ```
   *
   * @param associationName - The name of the association to destroy
   * @param opts.whereStatement - Optional where statement to apply to query before destroying
   * @param opts.skipHooks - if true, will skip applying model hooks. Defaults to false
   * @param opts.cascade - if false, will skip applying cascade undeletes on "dependent: 'destroy'" associations. Defaults to true
   * @returns The number of records deleted
   */
  public async destroyAssociation<
    I extends DreamInstanceTransactionBuilder<DreamInstance>,
    Schema extends DreamInstance['dreamconf']['schema'],
    AssociationName extends keyof Schema[DreamInstance['table']]['associations'],
  >(this: I, associationName: AssociationName, destroyAssociationOptions?: unknown): Promise<number> {
    return await destroyAssociation(
      this.dreamInstance,
      this.dreamTransaction,
      associationName,
      (destroyAssociationOptions as any)?.where,
      {
        skipHooks: (destroyAssociationOptions as any)?.skipHooks,
        cascade: (destroyAssociationOptions as any)?.cascade,
      }
    )
  }
  //////////////////////////
  // end: destroyAssociation
  //////////////////////////

  ///////////////////////////
  // reallyDestroyAssociation
  ///////////////////////////
  public reallyDestroyAssociation<
    I extends DreamInstanceTransactionBuilder<DreamInstance>,
    AssociationName extends keyof DreamInstance &
      DreamAssociationNamesWithRequiredWhereClauses<DreamInstance>,
    DB extends DreamInstance['dreamconf']['DB'],
    TableName extends DreamInstance['table'],
    Schema extends DreamInstance['dreamconf']['schema'],
  >(
    this: I,
    associationName: AssociationName,
    destroyAssociationOptions: {
      where: WhereStatementForAssociation<DB, Schema, TableName, AssociationName>
      skipHooks?: boolean
      cascade?: boolean
    }
  ): Promise<number>

  public reallyDestroyAssociation<
    I extends DreamInstanceTransactionBuilder<DreamInstance>,
    AssociationName extends keyof DreamInstance &
      DreamAssociationNamesWithoutRequiredWhereClauses<DreamInstance>,
    DB extends DreamInstance['dreamconf']['DB'],
    TableName extends DreamInstance['table'],
    Schema extends DreamInstance['dreamconf']['schema'],
  >(
    this: I,
    associationName: AssociationName,
    destroyAssociationOptions?: {
      where?: WhereStatementForAssociation<DB, Schema, TableName, AssociationName>
      skipHooks?: boolean
      cascade?: boolean
    }
  ): Promise<number>

  /**
   * Destroys models associated with the current instance,
   * deleting their corresponding records within the database.
   *
   * If the record, or else any of it's associations
   * which are marked cascade: "destroy", are using
   * the SoftDelete decorator, it will be bypassed,
   * causing those records to be deleted from the database.
   *
   * ```ts
   * await ApplicationModel.transaction(async txn => {
   *   await user.txn(txn).reallyDestroyAssociation('posts', { body: 'hello world' })
   * })
   * ```
   *
   * @param associationName - The name of the association to destroy
   * @param opts.whereStatement - Optional where statement to apply to query before destroying
   * @param opts.skipHooks - if true, will skip applying model hooks. Defaults to false
   * @param opts.cascade - if false, will skip applying cascade undeletes on "dependent: 'destroy'" associations. Defaults to true
   * @returns The number of records deleted
   */
  public async reallyDestroyAssociation<
    I extends DreamInstanceTransactionBuilder<DreamInstance>,
    Schema extends DreamInstance['dreamconf']['schema'],
    AssociationName extends keyof Schema[DreamInstance['table']]['associations'],
  >(this: I, associationName: AssociationName, destroyAssociationOptions?: unknown): Promise<number> {
    return await destroyAssociation(
      this.dreamInstance,
      this.dreamTransaction,
      associationName,
      (destroyAssociationOptions as any)?.where,
      {
        skipHooks: (destroyAssociationOptions as any)?.skipHooks,
        cascade: (destroyAssociationOptions as any)?.cascade,
        reallyDestroy: true,
      }
    )
  }
  ////////////////////////////////
  // end: reallyDestroyAssociation
  ////////////////////////////////

  ///////////////////
  // undestroyAssociation
  ///////////////////
  public undestroyAssociation<
    I extends DreamInstanceTransactionBuilder<DreamInstance>,
    DB extends DreamInstance['dreamconf']['DB'],
    TableName extends DreamInstance['table'],
    Schema extends DreamInstance['dreamconf']['schema'],
    AssociationName extends keyof I & DreamAssociationNamesWithRequiredWhereClauses<DreamInstance>,
  >(
    this: I,
    associationName: AssociationName,
    destroyAssociationOptions: {
      where: WhereStatementForAssociation<DB, Schema, TableName, AssociationName>
      skipHooks?: boolean
      cascade?: boolean
    }
  ): Promise<number>

  public undestroyAssociation<
    I extends DreamInstanceTransactionBuilder<DreamInstance>,
    DB extends DreamInstance['dreamconf']['DB'],
    TableName extends DreamInstance['table'],
    Schema extends DreamInstance['dreamconf']['schema'],
    AssociationName extends keyof I & DreamAssociationNamesWithoutRequiredWhereClauses<DreamInstance>,
  >(
    this: I,
    associationName: AssociationName,
    destroyAssociationOptions?: {
      where?: WhereStatementForAssociation<DB, Schema, TableName, AssociationName>
      skipHooks?: boolean
      cascade?: boolean
    }
  ): Promise<number>

  /**
   * Undestroys a SoftDelete association.
   * If cascade: true is passed, any child
   * associations that have been soft deleted
   * will also be undeleted.
   *
   * ```ts
   * await user.undestroyAssociation('posts', { body: 'hello world' })
   * ```
   *
   * @param associationName - The name of the association to destroy
   * @param opts.whereStatement - Optional where statement to apply to query before undestroying
   * @param opts.skipHooks - if true, will skip applying model hooks. Defaults to false
   * @param opts.cascade - if false, will skip applying cascade undeletes on "dependent: 'destroy'" associations. Defaults to true
   * @returns The number of records undestroyed
   */
  public undestroyAssociation<
    I extends DreamInstanceTransactionBuilder<DreamInstance>,
    AssociationName extends keyof DreamInstance,
  >(this: I, associationName: AssociationName, destroyAssociationOptions?: unknown): unknown {
    return undestroyAssociation(
      this.dreamInstance,
      this.dreamTransaction,
      associationName,
      (destroyAssociationOptions as any)?.where,
      {
        skipHooks: (destroyAssociationOptions as any)?.skipHooks,
        cascade: (destroyAssociationOptions as any)?.cascade,
      }
    )
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
    const id = this.dreamInstance.primaryKeyValue

    return dreamClass.txn(this.dreamTransaction).where({ [this.dreamInstance.primaryKey]: id } as any)
  }
}
