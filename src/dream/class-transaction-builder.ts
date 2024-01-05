import { SelectArg, SelectExpression, Updateable } from 'kysely'
import { WhereStatement } from '../decorators/associations/shared'
import Dream from '../dream'
import DreamTransaction from './transaction'
import Query from './query'
import { AssociationTableNames } from '../db/reflections'
import {
  PreloadArgumentTypeAssociatedTableNames,
  JoinsArgumentTypeAssociatedTableNames,
  NextJoinsWhereArgumentType,
  NextPreloadArgumentType,
  UpdateablePropertiesForClass,
} from './types'
import { ExtractTableAlias } from 'kysely/dist/cjs/parser/table-parser'
import saveDream from './internal/saveDream'

export default class DreamClassTransactionBuilder<DreamClass extends typeof Dream> {
  public dreamClass: DreamClass
  public dreamTransaction: DreamTransaction<DreamClass>
  constructor(dreamClass: DreamClass, txn: DreamTransaction<DreamClass>) {
    this.dreamClass = dreamClass
    this.dreamTransaction = txn
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
    limit: number
  ): Query<DreamClass> {
    return this.queryInstance().limit(limit)
  }

  public offset<I extends DreamClassTransactionBuilder<DreamClass>>(
    this: I,
    offset: number
  ): Query<DreamClass> {
    return this.queryInstance().offset(offset)
  }

  public async max<
    I extends DreamClassTransactionBuilder<DreamClass>,
    TableName extends InstanceType<DreamClass>['table'],
    DB extends InstanceType<DreamClass>['DB'],
    SimpleFieldType extends keyof Updateable<DB[TableName]>
  >(this: I, field: SimpleFieldType): Promise<number> {
    return this.queryInstance().max(field as any)
  }

  public async min<
    I extends DreamClassTransactionBuilder<DreamClass>,
    TableName extends InstanceType<DreamClass>['table'],
    DB extends InstanceType<DreamClass>['DB'],
    SimpleFieldType extends keyof Updateable<DB[TableName]>
  >(this: I, field: SimpleFieldType): Promise<number> {
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
      keyof InstanceType<I['dreamClass']>['dreamconf']['interpretedDB']
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
    DB extends InstanceType<DreamClass>['DB']
  >(
    this: I,
    attributes: Updateable<DB[InstanceType<DreamClass>['table']]>
  ): Promise<InstanceType<DreamClass> | null> {
    return await this.queryInstance()
      .where(attributes as any)
      .first()
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
    //
    A extends NextPreloadArgumentType<SyncedAssociations, TableName>,
    ATableName extends PreloadArgumentTypeAssociatedTableNames<SyncedAssociations, TableName, A>,
    B extends NextPreloadArgumentType<SyncedAssociations, ATableName>,
    BTableName extends PreloadArgumentTypeAssociatedTableNames<SyncedAssociations, ATableName, B>,
    C extends NextPreloadArgumentType<SyncedAssociations, BTableName>,
    CTableName extends PreloadArgumentTypeAssociatedTableNames<SyncedAssociations, BTableName, C>,
    D extends NextPreloadArgumentType<SyncedAssociations, CTableName>,
    DTableName extends PreloadArgumentTypeAssociatedTableNames<SyncedAssociations, CTableName, D>,
    E extends NextPreloadArgumentType<SyncedAssociations, DTableName>,
    ETableName extends PreloadArgumentTypeAssociatedTableNames<SyncedAssociations, DTableName, E>,
    F extends NextPreloadArgumentType<SyncedAssociations, ETableName>,
    FTableName extends PreloadArgumentTypeAssociatedTableNames<SyncedAssociations, ETableName, F>,
    G extends NextPreloadArgumentType<SyncedAssociations, FTableName>
  >(this: I, a: A, b?: B, c?: C, d?: D, e?: E, f?: F, g?: G) {
    return this.queryInstance().preload(a as any, b as any, c as any, d as any, e as any, f as any, g as any)
  }

  public joins<
    I extends DreamClassTransactionBuilder<DreamClass>,
    TableName extends InstanceType<DreamClass>['table'],
    DB extends InstanceType<DreamClass>['DB'],
    SyncedAssociations extends InstanceType<DreamClass>['syncedAssociations'],
    //
    A extends keyof SyncedAssociations[TableName] & string,
    ATableName extends (SyncedAssociations[TableName][A & keyof SyncedAssociations[TableName]] &
      string[])[number],
    //
    B extends NextJoinsWhereArgumentType<DB, SyncedAssociations, ATableName>,
    BTableName extends JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, ATableName, B>,
    C extends NextJoinsWhereArgumentType<DB, SyncedAssociations, BTableName>,
    CTableName extends JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, BTableName, C>,
    D extends NextJoinsWhereArgumentType<DB, SyncedAssociations, CTableName>,
    DTableName extends JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, CTableName, D>,
    E extends NextJoinsWhereArgumentType<DB, SyncedAssociations, DTableName>,
    ETableName extends JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, DTableName, E>,
    F extends NextJoinsWhereArgumentType<DB, SyncedAssociations, ETableName>,
    FTableName extends JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, ETableName, F>,
    G extends NextJoinsWhereArgumentType<DB, SyncedAssociations, FTableName>
  >(this: I, a: A, b?: B, c?: C, d?: D, e?: E, f?: F, g?: G) {
    return this.queryInstance().joins(a as any, b as any, c as any, d as any, e as any, f as any, g as any)
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
    SE extends SelectExpression<DB, ExtractTableAlias<DB, InstanceType<DreamClass>['table']>>
  >(this: I, selection: SelectArg<DB, ExtractTableAlias<DB, InstanceType<DreamClass>['table']>, SE>) {
    return this.queryInstance().nestedSelect(selection as any)
  }

  public order<
    I extends DreamClassTransactionBuilder<DreamClass>,
    ColumnName extends keyof Table & string,
    DB extends InstanceType<DreamClass>['DB'],
    SyncedAssociations extends InstanceType<DreamClass>['syncedAssociations'],
    TableName extends AssociationTableNames<DB, SyncedAssociations> &
      keyof DB = InstanceType<DreamClass>['table'],
    Table extends DB[keyof DB] = DB[TableName]
  >(this: I, column: ColumnName, direction: 'asc' | 'desc' = 'asc') {
    return this.queryInstance().order(column as any, direction)
  }

  public async pluck<
    I extends DreamClassTransactionBuilder<DreamClass>,
    DB extends InstanceType<DreamClass>['DB'],
    SE extends SelectExpression<DB, ExtractTableAlias<DB, InstanceType<DreamClass>['table']>>
  >(this: I, ...fields: SelectArg<DB, ExtractTableAlias<DB, InstanceType<DreamClass>['table']>, SE>[]) {
    return await this.queryInstance().pluck(...(fields as any[]))
  }

  public where<
    I extends DreamClassTransactionBuilder<DreamClass>,
    DB extends InstanceType<DreamClass>['DB'],
    SyncedAssociations extends InstanceType<DreamClass>['syncedAssociations'],
    TableName extends AssociationTableNames<DB, SyncedAssociations> & keyof DB = InstanceType<
      I['dreamClass']
    >['table'] &
      keyof DB
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
      keyof DB
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
      keyof DB
  >(this: I, attributes: WhereStatement<DB, SyncedAssociations, TableName>): Query<DreamClass> {
    return this.queryInstance().whereNot(attributes as any)
  }
}
