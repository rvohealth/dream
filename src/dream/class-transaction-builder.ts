import { SelectArg, SelectExpression, Updateable } from 'kysely'
import { PassthroughWhere, WhereStatement } from '../decorators/associations/shared'
import Dream from '../dream'
import DreamTransaction from './transaction'
import Query, { FindEachOpts } from './query'
import { AssociationTableNames } from '../db/reflections'
import {
  UpdateablePropertiesForClass,
  DreamClassColumns,
  OrderDir,
  VariadicPluckThroughArgs,
  VariadicPluckEachThroughArgs,
  VariadicJoinsArgs,
  VariadicLoadArgs,
} from './types'
import { ExtractTableAlias } from 'kysely/dist/cjs/parser/table-parser'
import saveDream from './internal/saveDream'

export default class DreamClassTransactionBuilder<DreamClass extends typeof Dream> {
  constructor(
    public dreamClass: DreamClass,
    public dreamTransaction: DreamTransaction<Dream>
  ) {
    this.dreamClass = dreamClass
    this.dreamTransaction = dreamTransaction
  }

  public async all<I extends DreamClassTransactionBuilder<DreamClass>>(
    this: I
  ): Promise<InstanceType<DreamClass>[]> {
    return this.queryInstance().all()
  }

  public async count<I extends DreamClassTransactionBuilder<DreamClass>>(this: I): Promise<number> {
    return this.queryInstance().count()
  }

  public limit<I extends DreamClassTransactionBuilder<DreamClass>>(
    this: I,
    limit: number | null
  ): Query<DreamClass> {
    return this.queryInstance().limit(limit)
  }

  public offset<I extends DreamClassTransactionBuilder<DreamClass>>(
    this: I,
    offset: number | null
  ): Query<DreamClass> {
    return this.queryInstance().offset(offset)
  }

  public async max<I extends DreamClassTransactionBuilder<DreamClass>>(
    this: I,
    field: DreamClassColumns<DreamClass>
  ): Promise<number> {
    return this.queryInstance().max(field as any)
  }

  public async min<I extends DreamClassTransactionBuilder<DreamClass>>(
    this: I,
    field: DreamClassColumns<DreamClass>
  ): Promise<number> {
    return this.queryInstance().min(field as any)
  }

  public async create<I extends DreamClassTransactionBuilder<DreamClass>>(
    this: I,
    opts?: UpdateablePropertiesForClass<DreamClass>
  ): Promise<InstanceType<DreamClass>> {
    const dream = this.dreamClass.new(opts) as InstanceType<DreamClass>
    return saveDream<InstanceType<DreamClass>>(dream, this.dreamTransaction as any)
  }

  public async find<
    I extends DreamClassTransactionBuilder<DreamClass>,
    TableName extends keyof InstanceType<I['dreamClass']>['dreamconf']['interpretedDB'] = InstanceType<
      I['dreamClass']
    >['table'] &
      keyof InstanceType<I['dreamClass']>['dreamconf']['interpretedDB'],
  >(
    this: I,
    id: InstanceType<I['dreamClass']>['dreamconf']['interpretedDB'][TableName][DreamClass['primaryKey'] &
      keyof InstanceType<I['dreamClass']>['dreamconf']['interpretedDB'][TableName]]
  ): Promise<InstanceType<DreamClass> | null> {
    return await this.queryInstance()
      .where({ [this.dreamClass.primaryKey]: id } as any)
      .first()
  }

  public async findBy<
    I extends DreamClassTransactionBuilder<DreamClass>,
    DB extends InstanceType<DreamClass>['DB'],
  >(
    this: I,
    attributes: Updateable<DB[InstanceType<DreamClass>['table']]>
  ): Promise<InstanceType<DreamClass> | null> {
    return await this.queryInstance()
      .where(attributes as any)
      .first()
  }

  public async findEach<I extends DreamClassTransactionBuilder<DreamClass>>(
    this: I,
    cb: (instance: InstanceType<DreamClass>) => void | Promise<void>,
    opts?: FindEachOpts
  ): Promise<void> {
    await this.queryInstance().findEach(cb, opts)
  }

  public async first<I extends DreamClassTransactionBuilder<DreamClass>>(
    this: I
  ): Promise<InstanceType<DreamClass> | null> {
    return this.queryInstance().first()
  }

  public async exists<I extends DreamClassTransactionBuilder<DreamClass>>(this: I): Promise<boolean> {
    return this.queryInstance().exists()
  }

  public preload<
    I extends DreamClassTransactionBuilder<DreamClass>,
    TableName extends InstanceType<DreamClass>['table'],
    SyncedAssociations extends InstanceType<DreamClass>['syncedAssociations'],
    const Arr extends readonly unknown[],
  >(this: I, ...args: [...Arr, VariadicLoadArgs<SyncedAssociations, TableName, Arr>]) {
    return this.queryInstance().preload(...(args as any))
  }

  public joins<
    I extends DreamClassTransactionBuilder<DreamClass>,
    TableName extends InstanceType<DreamClass>['table'],
    DB extends InstanceType<DreamClass>['DB'],
    SyncedAssociations extends InstanceType<DreamClass>['syncedAssociations'],
    const Arr extends readonly unknown[],
  >(this: I, ...args: [...Arr, VariadicJoinsArgs<DB, SyncedAssociations, TableName, Arr>]) {
    return this.queryInstance().joins(...(args as any))
  }

  public async pluckThrough<
    I extends DreamClassTransactionBuilder<DreamClass>,
    DB extends InstanceType<DreamClass>['DB'],
    SyncedAssociations extends InstanceType<DreamClass>['syncedAssociations'],
    TableName extends InstanceType<DreamClass>['table'],
    const Arr extends readonly unknown[],
  >(this: I, ...args: [...Arr, VariadicPluckThroughArgs<DB, SyncedAssociations, TableName, Arr>]) {
    return this.queryInstance().pluckThrough(...(args as any))
  }

  public async pluckEachThrough<
    I extends DreamClassTransactionBuilder<DreamClass>,
    DB extends InstanceType<DreamClass>['DB'],
    SyncedAssociations extends InstanceType<DreamClass>['syncedAssociations'],
    TableName extends InstanceType<DreamClass>['table'],
    const Arr extends readonly unknown[],
  >(
    this: I,
    ...args: [...Arr, VariadicPluckEachThroughArgs<DB, SyncedAssociations, TableName, Arr>]
  ): Promise<void> {
    return this.queryInstance().pluckEachThrough(...(args as any))
  }

  public queryInstance<I extends DreamClassTransactionBuilder<DreamClass>>(this: I): Query<DreamClass> {
    return new Query<DreamClass>(this.dreamClass).txn(this.dreamTransaction)
  }

  public unscoped<I extends DreamClassTransactionBuilder<DreamClass>>(this: I): Query<DreamClass> {
    return this.queryInstance().unscoped()
  }

  public async last<I extends DreamClassTransactionBuilder<DreamClass>>(
    this: I
  ): Promise<InstanceType<DreamClass> | null> {
    return this.queryInstance().last()
  }

  public nestedSelect<
    I extends DreamClassTransactionBuilder<DreamClass>,
    DB extends InstanceType<DreamClass>['DB'],
    SE extends SelectExpression<DB, ExtractTableAlias<DB, InstanceType<DreamClass>['table']>>,
  >(this: I, selection: SelectArg<DB, ExtractTableAlias<DB, InstanceType<DreamClass>['table']>, SE>) {
    return this.queryInstance().nestedSelect(selection as any)
  }

  public order<I extends DreamClassTransactionBuilder<DreamClass>>(
    this: I,
    arg: DreamClassColumns<DreamClass> | Partial<Record<DreamClassColumns<DreamClass>, OrderDir>> | null
  ) {
    return this.queryInstance().order(arg as any) as Query<DreamClass>
  }

  public async pluck<
    I extends DreamClassTransactionBuilder<DreamClass>,
    TableName extends InstanceType<DreamClass>['table'],
    ColumnType extends DreamClassColumns<DreamClass>,
  >(this: I, ...fields: (ColumnType | `${TableName}.${ColumnType}`)[]) {
    return await this.queryInstance().pluck(...(fields as any[]))
  }

  public async pluckEach<
    I extends DreamClassTransactionBuilder<DreamClass>,
    TableName extends InstanceType<DreamClass>['table'],
    ColumnType extends DreamClassColumns<DreamClass>,
    CB extends (plucked: any) => void | Promise<void>,
  >(this: I, ...fields: (ColumnType | `${TableName}.${ColumnType}` | CB | FindEachOpts)[]): Promise<void> {
    await this.queryInstance().pluckEach(...fields)
  }

  public passthrough<
    I extends DreamClassTransactionBuilder<DreamClass>,
    AllColumns extends InstanceType<DreamClass>['allColumns'],
  >(this: I, passthroughWhereStatement: PassthroughWhere<AllColumns>): Query<DreamClass> {
    return this.queryInstance().passthrough(passthroughWhereStatement as any)
  }

  public where<
    I extends DreamClassTransactionBuilder<DreamClass>,
    DB extends InstanceType<DreamClass>['DB'],
    SyncedAssociations extends InstanceType<DreamClass>['syncedAssociations'],
    TableName extends AssociationTableNames<DB, SyncedAssociations> & keyof DB = InstanceType<
      I['dreamClass']
    >['table'] &
      keyof DB,
  >(this: I, attributes: WhereStatement<DB, SyncedAssociations, TableName>): Query<DreamClass> {
    return this.queryInstance().where(attributes as any)
  }

  public whereAny<
    I extends DreamClassTransactionBuilder<DreamClass>,
    DB extends InstanceType<DreamClass>['DB'],
    SyncedAssociations extends InstanceType<DreamClass>['syncedAssociations'],
    TableName extends AssociationTableNames<DB, SyncedAssociations> & keyof DB = InstanceType<
      I['dreamClass']
    >['table'] &
      keyof DB,
  >(this: I, attributes: WhereStatement<DB, SyncedAssociations, TableName>[]): Query<DreamClass> {
    return this.queryInstance().whereAny(attributes as any)
  }

  public whereNot<
    I extends DreamClassTransactionBuilder<DreamClass>,
    DB extends InstanceType<DreamClass>['DB'],
    SyncedAssociations extends InstanceType<DreamClass>['syncedAssociations'],
    TableName extends AssociationTableNames<DB, SyncedAssociations> & keyof DB = InstanceType<
      I['dreamClass']
    >['table'] &
      keyof DB,
  >(this: I, attributes: WhereStatement<DB, SyncedAssociations, TableName>): Query<DreamClass> {
    return this.queryInstance().whereNot(attributes as any)
  }
}
