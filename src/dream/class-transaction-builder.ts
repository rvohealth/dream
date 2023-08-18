import { SelectArg, SelectExpression, Updateable } from 'kysely'
import { WhereStatement } from '../decorators/associations/shared'
import { DB, InterpretedDB } from '../sync/schema'
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
import { SyncedAssociations } from '../sync/associations'

export default class DreamClassTransactionBuilder<DreamClass extends typeof Dream> {
  public dreamClass: DreamClass
  public dreamTransaction: DreamTransaction
  constructor(dreamClass: DreamClass, txn: DreamTransaction) {
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

  public async max<
    I extends DreamClassTransactionBuilder<DreamClass>,
    TableName extends InstanceType<DreamClass>['table'],
    SimpleFieldType extends keyof Updateable<DB[TableName]>
  >(this: I, field: SimpleFieldType): Promise<number> {
    return this.queryInstance().max(field as any)
  }

  public async min<
    I extends DreamClassTransactionBuilder<DreamClass>,
    TableName extends InstanceType<DreamClass>['table'],
    SimpleFieldType extends keyof Updateable<DB[TableName]>
  >(this: I, field: SimpleFieldType): Promise<number> {
    return this.queryInstance().min(field as any)
  }

  public async create<I extends DreamClassTransactionBuilder<DreamClass>>(
    this: I,
    opts?: UpdateablePropertiesForClass<DreamClass>
  ): Promise<InstanceType<DreamClass>> {
    const dream = this.dreamClass.new(opts) as InstanceType<DreamClass>
    return saveDream(dream, this.dreamTransaction)
  }

  public async find<
    I extends DreamClassTransactionBuilder<DreamClass>,
    TableName extends keyof InterpretedDB = InstanceType<I['dreamClass']>['table'] & keyof InterpretedDB
  >(
    this: I,
    id: InterpretedDB[TableName][DreamClass['primaryKey'] & keyof InterpretedDB[TableName]]
  ): Promise<InstanceType<DreamClass> | null> {
    return await this.queryInstance()
      .where({ [this.dreamClass.primaryKey]: id } as any)
      .first()
  }

  public async findBy<I extends DreamClassTransactionBuilder<DreamClass>>(
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

  public preload<
    I extends DreamClassTransactionBuilder<DreamClass>,
    TableName extends InstanceType<DreamClass>['table'],
    //
    A extends NextPreloadArgumentType<TableName>,
    ATableName extends PreloadArgumentTypeAssociatedTableNames<TableName, A>,
    B extends NextPreloadArgumentType<ATableName>,
    BTableName extends PreloadArgumentTypeAssociatedTableNames<ATableName, B>,
    C extends NextPreloadArgumentType<BTableName>,
    CTableName extends PreloadArgumentTypeAssociatedTableNames<BTableName, C>,
    D extends NextPreloadArgumentType<CTableName>,
    DTableName extends PreloadArgumentTypeAssociatedTableNames<CTableName, D>,
    E extends NextPreloadArgumentType<DTableName>,
    ETableName extends PreloadArgumentTypeAssociatedTableNames<DTableName, E>,
    F extends NextPreloadArgumentType<ETableName>,
    FTableName extends PreloadArgumentTypeAssociatedTableNames<ETableName, F>,
    //
    G extends FTableName extends undefined
      ? undefined
      : (keyof SyncedAssociations[FTableName & keyof SyncedAssociations] & string)[]
  >(this: I, a: A, b?: B, c?: C, d?: D, e?: E, f?: F, g?: G) {
    return this.queryInstance().preload(a as any, b as any, c as any, d as any, e as any, f as any, g as any)
  }

  public joins<
    I extends DreamClassTransactionBuilder<DreamClass>,
    TableName extends InstanceType<DreamClass>['table'],
    //
    A extends keyof SyncedAssociations[TableName] & string,
    ATableName extends (SyncedAssociations[TableName][A & keyof SyncedAssociations[TableName]] &
      string[])[number],
    //
    B extends NextJoinsWhereArgumentType<ATableName>,
    BTableName extends JoinsArgumentTypeAssociatedTableNames<ATableName, B>,
    C extends NextJoinsWhereArgumentType<BTableName>,
    CTableName extends JoinsArgumentTypeAssociatedTableNames<BTableName, C>,
    D extends NextJoinsWhereArgumentType<CTableName>,
    DTableName extends JoinsArgumentTypeAssociatedTableNames<CTableName, D>,
    E extends NextJoinsWhereArgumentType<DTableName>,
    ETableName extends JoinsArgumentTypeAssociatedTableNames<DTableName, E>,
    F extends NextJoinsWhereArgumentType<ETableName>,
    FTableName extends JoinsArgumentTypeAssociatedTableNames<ETableName, F>,
    //
    G extends FTableName extends undefined ? undefined : WhereStatement<FTableName & AssociationTableNames>
  >(this: I, a: A, b?: B, c?: C, d?: D, e?: E, f?: F, g?: G) {
    return this.queryInstance().joins(a as any, b as any, c as any, d as any, e as any, f as any, g as any)
  }

  public queryInstance<I extends DreamClassTransactionBuilder<DreamClass>>(this: I): Query<DreamClass> {
    return new Query<DreamClass>(this.dreamClass).txn(this.dreamTransaction)
  }

  public async last<I extends DreamClassTransactionBuilder<DreamClass>>(
    this: I
  ): Promise<InstanceType<DreamClass> | null> {
    return this.queryInstance().last()
  }

  public nestedSelect<
    I extends DreamClassTransactionBuilder<DreamClass>,
    SE extends SelectExpression<DB, ExtractTableAlias<DB, InstanceType<DreamClass>['table']>>
  >(this: I, selection: SelectArg<DB, ExtractTableAlias<DB, InstanceType<DreamClass>['table']>, SE>) {
    return this.queryInstance().nestedSelect(selection as any)
  }

  public order<
    I extends DreamClassTransactionBuilder<DreamClass>,
    ColumnName extends keyof Table & string,
    TableName extends AssociationTableNames = InstanceType<DreamClass>['table'],
    Table extends DB[keyof DB] = DB[TableName]
  >(this: I, column: ColumnName, direction: 'asc' | 'desc' = 'asc') {
    return this.queryInstance().order(column as any, direction)
  }

  public async pluck<
    I extends DreamClassTransactionBuilder<DreamClass>,
    SE extends SelectExpression<DB, ExtractTableAlias<DB, InstanceType<DreamClass>['table']>>
  >(this: I, ...fields: SelectArg<DB, ExtractTableAlias<DB, InstanceType<DreamClass>['table']>, SE>[]) {
    return await this.queryInstance().pluck(...(fields as any[]))
  }

  public where<
    I extends DreamClassTransactionBuilder<DreamClass>,
    TableName extends keyof DB = InstanceType<I['dreamClass']>['table'] & keyof DB
  >(this: I, attributes: WhereStatement<TableName>): Query<DreamClass> {
    return this.queryInstance().where(attributes as any)
  }

  public whereNot<
    I extends DreamClassTransactionBuilder<DreamClass>,
    TableName extends keyof DB = InstanceType<I['dreamClass']>['table'] & keyof DB
  >(this: I, attributes: WhereStatement<TableName>): Query<DreamClass> {
    return this.queryInstance().whereNot(attributes as any)
  }
}
