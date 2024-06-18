import { WhereStatementForAssociation } from '../decorators/associations/shared'
import Dream from '../dream'
import associationQuery from './internal/associations/associationQuery'
import associationUpdateQuery from './internal/associations/associationUpdateQuery'
import createAssociation from './internal/associations/createAssociation'
import destroyAssociation from './internal/associations/destroyAssociation'
import destroyDream from './internal/destroyDream'
import reload from './internal/reload'
import saveDream from './internal/saveDream'
import LoadBuilder from './load-builder'
import Query from './query'
import DreamTransaction from './transaction'
import {
  DreamAssociationNamesWithRequiredWhereClauses,
  DreamAssociationNamesWithoutRequiredWhereClauses,
  DreamAssociationType,
  DreamAttributes,
  DreamConstructorType,
  FinalVariadicDreamClass,
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
   * Retrieves the min value of the specified column
   * for a provided association.
   *
   * ```ts
   * await ApplicationModel.transaction(async txn => {
   *   const firstPostId = await user.txn(txn).minThrough('posts', 'posts.id')
   * })
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
    FinalDreamClass extends FinalVariadicDreamClass<DreamInstance, DB, Schema, TableName, Arr>,
    FinalColumnType extends FinalDreamClass[FinalColumn & keyof FinalDreamClass],
  >(this: I, ...args: [...Arr, FinalColumnWithAlias]): Promise<FinalColumnType> {
    return (await this.queryInstance().minThrough(...(args as any))) as FinalColumnType
  }

  /**
   * Retrieves the max value of the specified column
   * for a provided association.
   *
   * ```ts
   * await ApplicationModel.transaction(async txn => {
   *   const lastPostId = await user.txn(txn).maxThrough('posts', 'posts.id')
   * })
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
    FinalDreamClass extends FinalVariadicDreamClass<DreamInstance, DB, Schema, TableName, Arr>,
    FinalColumnType extends FinalDreamClass[FinalColumn & keyof FinalDreamClass],
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
   * TODO: change behavior as part of
   * https://rvohealth.atlassian.net/browse/PDTC-5488
   * NOTE: This bypasses update and save model hooks
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

  private queryInstance<I extends DreamInstanceTransactionBuilder<DreamInstance>>(
    this: I
  ): Query<DreamInstance> {
    const dreamClass = this.dreamInstance.constructor as DreamConstructorType<DreamInstance>
    const id = this.dreamInstance.primaryKeyValue

    return dreamClass.txn(this.dreamTransaction).where({ [this.dreamInstance.primaryKey]: id } as any)
  }
}
