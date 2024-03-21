import Dream from '../dream'
import DreamTransaction from './transaction'
import saveDream from './internal/saveDream'
import destroyDream from './internal/destroyDream'
import {
  UpdateableProperties,
  DreamConstructorType,
  UpdateableAssociationProperties,
  VariadicPluckThroughArgs,
  VariadicPluckEachThroughArgs,
  VariadicLoadArgs,
} from './types'
import associationQuery from './internal/associations/associationQuery'
import associationUpdateQuery from './internal/associations/associationUpdateQuery'
import createAssociation from './internal/associations/createAssociation'
import reload from './internal/reload'
import destroyAssociation from './internal/associations/destroyAssociation'
import Query from './query'
import LoadBuilder from './load-builder'
import { AssociationTableNames } from '../db/reflections'
import { WhereStatement } from '../decorators/associations/shared'

export default class DreamInstanceTransactionBuilder<DreamInstance extends Dream> {
  public dreamInstance: DreamInstance
  public dreamTransaction: DreamTransaction<Dream>

  constructor(dreamInstance: DreamInstance, txn: DreamTransaction<Dream>) {
    this.dreamInstance = dreamInstance
    this.dreamTransaction = txn
  }

  public async pluckThrough<
    I extends DreamInstanceTransactionBuilder<DreamInstance>,
    DB extends DreamInstance['DB'],
    SyncedAssociations extends DreamInstance['syncedAssociations'],
    TableName extends DreamInstance['table'],
    const Arr extends readonly unknown[],
  >(
    this: I,
    ...args: [...Arr, VariadicPluckThroughArgs<DB, SyncedAssociations, TableName, Arr>]
  ): Promise<any[]> {
    return this.queryInstance().pluckThrough(...(args as any))
  }

  public async pluckEachThrough<
    I extends DreamInstanceTransactionBuilder<DreamInstance>,
    DB extends DreamInstance['DB'],
    SyncedAssociations extends DreamInstance['syncedAssociations'],
    TableName extends DreamInstance['table'],
    const Arr extends readonly unknown[],
  >(this: I, ...args: [...Arr, VariadicPluckEachThroughArgs<DB, SyncedAssociations, TableName, Arr>]) {
    return this.queryInstance().pluckEachThrough(...(args as any))
  }

  public load<
    I extends DreamInstanceTransactionBuilder<DreamInstance>,
    TableName extends DreamInstance['table'],
    SyncedAssociations extends DreamInstance['syncedAssociations'],
    const Arr extends readonly unknown[],
  >(
    this: I,
    ...args: [...Arr, VariadicLoadArgs<SyncedAssociations, TableName, Arr>]
  ): LoadBuilder<DreamInstance> {
    return new LoadBuilder<DreamInstance>(this.dreamInstance, this.dreamTransaction).load(...(args as any))
  }

  public async destroy<I extends DreamInstanceTransactionBuilder<DreamInstance>>(
    this: I
  ): Promise<DreamInstance> {
    return destroyDream<DreamInstance>(this.dreamInstance, this.dreamTransaction)
  }

  public async update<I extends DreamInstanceTransactionBuilder<DreamInstance>>(
    this: I,
    attributes: UpdateableProperties<DreamInstance>
  ): Promise<DreamInstance> {
    this.dreamInstance.assignAttributes(attributes)
    return saveDream(this.dreamInstance, this.dreamTransaction)
  }

  public async updateAttributes<I extends DreamInstanceTransactionBuilder<DreamInstance>>(
    this: I,
    attributes: UpdateableProperties<DreamInstance>
  ): Promise<DreamInstance> {
    this.dreamInstance.setAttributes(attributes)
    return saveDream(this.dreamInstance, this.dreamTransaction)
  }

  public async reload<I extends DreamInstanceTransactionBuilder<DreamInstance>>(this: I) {
    return reload(this.dreamInstance, this.dreamTransaction)
  }

  public async save<I extends DreamInstanceTransactionBuilder<DreamInstance>>(this: I) {
    return saveDream(this.dreamInstance, this.dreamTransaction)
  }

  public associationQuery<
    I extends DreamInstanceTransactionBuilder<DreamInstance>,
    AssociationName extends keyof DreamInstance['syncedAssociations'][DreamInstance['table']],
  >(this: I, associationName: AssociationName): any {
    return associationQuery(this.dreamInstance, this.dreamTransaction, associationName)
  }

  public associationUpdateQuery<
    I extends DreamInstanceTransactionBuilder<DreamInstance>,
    AssociationName extends keyof DreamInstance['syncedAssociations'][DreamInstance['table']],
  >(this: I, associationName: AssociationName): any {
    return associationUpdateQuery(this.dreamInstance, this.dreamTransaction, associationName)
  }

  public async createAssociation<
    I extends DreamInstanceTransactionBuilder<DreamInstance>,
    AssociationName extends keyof DreamInstance['syncedAssociations'][DreamInstance['table']],
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

  public async destroyAssociation<
    I extends DreamInstanceTransactionBuilder<DreamInstance>,
    SyncedAssociations extends DreamInstance['syncedAssociations'],
    AssociationName extends keyof SyncedAssociations[DreamInstance['table']],
    AssociationTableName extends
      SyncedAssociations[DreamInstance['table']][AssociationName] extends (keyof SyncedAssociations)[]
        ? SyncedAssociations[DreamInstance['table']][AssociationName][0]
        : never = SyncedAssociations[DreamInstance['table']][AssociationName] extends (keyof SyncedAssociations)[]
      ? SyncedAssociations[DreamInstance['table']][AssociationName][0]
      : never,
    RestrictedAssociationTableName extends AssociationTableName &
      AssociationTableNames<DreamInstance['DB'], SyncedAssociations> &
      keyof DreamInstance['DB'] = AssociationTableName &
      AssociationTableNames<DreamInstance['DB'], SyncedAssociations> &
      keyof DreamInstance['DB'],
  >(
    this: I,
    associationName: AssociationName,
    opts: WhereStatement<DreamInstance['DB'], SyncedAssociations, RestrictedAssociationTableName> = {}
  ): Promise<number> {
    return await destroyAssociation(this.dreamInstance, this.dreamTransaction, associationName, opts)
  }

  private queryInstance<
    I extends DreamInstanceTransactionBuilder<DreamInstance>,
    DreamClass extends DreamConstructorType<DreamInstance>,
  >(this: I): Query<DreamClass> {
    const dreamClass = this.dreamInstance.constructor as DreamClass
    const id = this.dreamInstance.primaryKeyValue

    return dreamClass.txn(this.dreamTransaction).where({ [this.dreamInstance.primaryKey]: id } as any)
  }
}
