import { SelectArg, SelectExpression, SelectType, Updateable } from 'kysely'
import { AssociatedModelParam, WhereStatement } from '../decorators/associations/shared'
import { DB } from '../sync/schema'
import Dream from '../dream'
import DreamTransaction from './transaction'
import db from '../db'
import Query from './query'
import { AssociationTableNames } from '../db/reflections'
import { AssociationExpression } from './types'
import { ExtractTableAlias } from 'kysely/dist/cjs/parser/table-parser'
import saveDream from './internal/saveDream'

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
    const query: Query<DreamClass> = new Query<DreamClass>(this.dreamClass).txn(this.dreamTransaction)
    return query.all()
  }

  public async count<I extends DreamClassTransactionBuilder<DreamClass>>(this: I): Promise<number> {
    const query: Query<DreamClass> = new Query<DreamClass>(this.dreamClass).txn(this.dreamTransaction)
    return query.count()
  }

  public async create<
    I extends DreamClassTransactionBuilder<DreamClass>,
    TableName extends keyof DB = InstanceType<I['dreamClass']>['table'] & keyof DB
  >(
    this: I,
    opts?: Updateable<DB[TableName]> | AssociatedModelParam<DreamClass>
  ): Promise<InstanceType<DreamClass>> {
    const dream = this.dreamClass.new(opts) as InstanceType<DreamClass>
    return saveDream(dream, this.dreamTransaction)
  }

  public async find<
    I extends DreamClassTransactionBuilder<DreamClass>,
    TableName extends keyof DB = InstanceType<I['dreamClass']>['table'] & keyof DB,
    Table extends DB[keyof DB] = DB[TableName],
    IdColumn = DreamClass['primaryKey'] & keyof Table,
    Id = Readonly<SelectType<IdColumn>>
  >(this: I, id: Id): Promise<InstanceType<DreamClass> | null> {
    const query: Query<DreamClass> = new Query<DreamClass>(this.dreamClass).txn(this.dreamTransaction)
    return await query.where({ [this.dreamClass.primaryKey]: id } as any).first()
  }

  public async findBy<I extends DreamClassTransactionBuilder<DreamClass>>(
    this: I,
    attributes: Updateable<DB[InstanceType<DreamClass>['table']]>
  ): Promise<InstanceType<DreamClass> | null> {
    const query: Query<DreamClass> = new Query<DreamClass>(this.dreamClass).txn(this.dreamTransaction)
    return await query.where(attributes as any).first()
  }

  public async first<I extends DreamClassTransactionBuilder<DreamClass>>(
    this: I
  ): Promise<InstanceType<DreamClass> | null> {
    const query: Query<DreamClass> = new Query<DreamClass>(this.dreamClass).txn(this.dreamTransaction)
    return query.first()
  }

  public includes<
    I extends DreamClassTransactionBuilder<DreamClass>,
    TableName extends keyof DB = InstanceType<I['dreamClass']>['table'] & keyof DB,
    QueryAssociationExpression extends AssociationExpression<
      TableName & AssociationTableNames,
      any
    > = AssociationExpression<TableName & AssociationTableNames, any>
  >(this: I, ...associations: QueryAssociationExpression[]) {
    const query: Query<DreamClass> = new Query<DreamClass>(this.dreamClass).txn(this.dreamTransaction)
    return query.includes(...(associations as any))
  }

  public async last<I extends DreamClassTransactionBuilder<DreamClass>>(
    this: I
  ): Promise<InstanceType<DreamClass> | null> {
    const query: Query<DreamClass> = new Query<DreamClass>(this.dreamClass).txn(this.dreamTransaction)
    return query.last()
  }

  public nestedSelect<
    I extends DreamClassTransactionBuilder<DreamClass>,
    SE extends SelectExpression<
      DB,
      ExtractTableAlias<DB, InstanceType<DreamClass>['table'] & AssociationTableNames>
    >
  >(
    this: I,
    selection: SelectArg<
      DB,
      ExtractTableAlias<DB, InstanceType<DreamClass>['table'] & AssociationTableNames>,
      SE
    >
  ) {
    const query: Query<DreamClass> = new Query<DreamClass>(this.dreamClass).txn(this.dreamTransaction)
    return query.nestedSelect(selection as any)
  }

  public order<
    I extends DreamClassTransactionBuilder<DreamClass>,
    ColumnName extends keyof Table & string,
    TableName extends AssociationTableNames = InstanceType<DreamClass>['table'] & AssociationTableNames,
    Table extends DB[keyof DB] = DB[TableName]
  >(this: I, column: ColumnName, direction: 'asc' | 'desc' = 'asc') {
    const query: Query<DreamClass> = new Query<DreamClass>(this.dreamClass).txn(this.dreamTransaction)
    return query.order(column as any, direction)
  }

  public async pluck<
    I extends DreamClassTransactionBuilder<DreamClass>,
    SE extends SelectExpression<
      DB,
      ExtractTableAlias<DB, InstanceType<DreamClass>['table'] & AssociationTableNames>
    >
  >(
    this: I,
    ...fields: SelectArg<
      DB,
      ExtractTableAlias<DB, InstanceType<DreamClass>['table'] & AssociationTableNames>,
      SE
    >[]
  ) {
    const query: Query<DreamClass> = new Query<DreamClass>(this.dreamClass).txn(this.dreamTransaction)
    return await query.pluck(...(fields as any[]))
  }

  public where<
    I extends DreamClassTransactionBuilder<DreamClass>,
    TableName extends keyof DB = InstanceType<I['dreamClass']>['table'] & keyof DB
  >(this: I, attributes: WhereStatement<TableName>) {
    const query: Query<DreamClass> = new Query<DreamClass>(this.dreamClass).txn(this.dreamTransaction)
    return query.where(attributes as any)
  }

  public whereNot<
    I extends DreamClassTransactionBuilder<DreamClass>,
    TableName extends keyof DB = InstanceType<I['dreamClass']>['table'] & keyof DB
  >(this: I, attributes: WhereStatement<TableName>) {
    const query: Query<DreamClass> = new Query<DreamClass>(this.dreamClass).txn(this.dreamTransaction)
    return query.whereNot(attributes as any)
  }
}
