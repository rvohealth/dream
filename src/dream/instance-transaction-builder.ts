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

  public load<
    I extends DreamInstanceTransactionBuilder<DreamInstance>,
    DB extends DreamInstance['dreamconf']['DB'],
    TableName extends DreamInstance['table'],
    Schema extends DreamInstance['dreamconf']['schema'],
    const Arr extends readonly unknown[],
  >(this: I, ...args: [...Arr, VariadicLoadArgs<DB, Schema, TableName, Arr>]): LoadBuilder<DreamInstance> {
    return new LoadBuilder<DreamInstance>(this.dreamInstance, this.dreamTransaction).load(...(args as any))
  }

  public async destroy<I extends DreamInstanceTransactionBuilder<DreamInstance>>(
    this: I,
    { skipHooks = false }: { skipHooks?: boolean } = {}
  ): Promise<DreamInstance> {
    return destroyDream<DreamInstance>(this.dreamInstance, this.dreamTransaction, { skipHooks })
  }

  public async reallyDestroy<I extends DreamInstanceTransactionBuilder<DreamInstance>>(
    this: I,
    { skipHooks = false }: { skipHooks?: boolean } = {}
  ): Promise<DreamInstance> {
    return destroyDream<DreamInstance>(this.dreamInstance, this.dreamTransaction, {
      skipHooks,
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
    { skipHooks = false, cascade = false }: { skipHooks?: boolean; cascade?: boolean } = {}
  ): Promise<I> {
    await undestroyDream(this.dreamInstance, this.dreamTransaction, { skipHooks, cascade })
    await this.reload()
    return this
  }

  public async update<I extends DreamInstanceTransactionBuilder<DreamInstance>>(
    this: I,
    attributes: UpdateableProperties<DreamInstance>
  ): Promise<void> {
    this.dreamInstance.assignAttributes(attributes)
    await saveDream(this.dreamInstance, this.dreamTransaction)
  }

  public async updateAttributes<I extends DreamInstanceTransactionBuilder<DreamInstance>>(
    this: I,
    attributes: UpdateableProperties<DreamInstance>
  ): Promise<void> {
    this.dreamInstance.setAttributes(attributes)
    await saveDream(this.dreamInstance, this.dreamTransaction)
  }

  public async reload<I extends DreamInstanceTransactionBuilder<DreamInstance>>(this: I): Promise<void> {
    await reload(this.dreamInstance, this.dreamTransaction)
  }

  public async save<I extends DreamInstanceTransactionBuilder<DreamInstance>>(this: I): Promise<void> {
    await saveDream(this.dreamInstance, this.dreamTransaction)
  }

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
    }
  ): Promise<number>

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
    }
  ): Promise<number>

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
   * @param opts.skipHooks - Whether or not to skip model hooks when undestroying
   * @param opts.cascade - Whether or not to cascade undestroy child associations
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

  private queryInstance<I extends DreamInstanceTransactionBuilder<DreamInstance>>(
    this: I
  ): Query<DreamInstance> {
    const dreamClass = this.dreamInstance.constructor as DreamConstructorType<DreamInstance>
    const id = this.dreamInstance.primaryKeyValue

    return dreamClass.txn(this.dreamTransaction).where({ [this.dreamInstance.primaryKey]: id } as any)
  }
}
