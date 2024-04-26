import { SelectArg, SelectExpression, Updateable } from 'kysely'
import { PassthroughWhere, WhereStatement } from '../decorators/associations/shared'
import Dream from '../dream'
import DreamTransaction from './transaction'
import Query, { FindEachOpts } from './query'
import { AssociationTableNames } from '../db/reflections'
import {
  OrderDir,
  VariadicPluckThroughArgs,
  VariadicPluckEachThroughArgs,
  VariadicJoinsArgs,
  VariadicLoadArgs,
  DreamColumnNames,
  UpdateableProperties,
} from './types'
import { ExtractTableAlias } from 'kysely/dist/cjs/parser/table-parser'
import saveDream from './internal/saveDream'

export default class DreamClassTransactionBuilder<DreamInstance extends Dream> {
  constructor(
    public dreamInstance: DreamInstance,
    public dreamTransaction: DreamTransaction<Dream>
  ) {}

  public async all<I extends DreamClassTransactionBuilder<DreamInstance>>(this: I): Promise<DreamInstance[]> {
    return this.queryInstance().all()
  }

  public async count<I extends DreamClassTransactionBuilder<DreamInstance>>(this: I): Promise<number> {
    return this.queryInstance().count()
  }

  public limit<I extends DreamClassTransactionBuilder<DreamInstance>>(
    this: I,
    limit: number | null
  ): Query<DreamInstance> {
    return this.queryInstance().limit(limit)
  }

  public offset<I extends DreamClassTransactionBuilder<DreamInstance>>(
    this: I,
    offset: number | null
  ): Query<DreamInstance> {
    return this.queryInstance().offset(offset)
  }

  public async max<I extends DreamClassTransactionBuilder<DreamInstance>>(
    this: I,
    field: DreamColumnNames<DreamInstance>
  ): Promise<number> {
    return this.queryInstance().max(field as any)
  }

  public async min<I extends DreamClassTransactionBuilder<DreamInstance>>(
    this: I,
    field: DreamColumnNames<DreamInstance>
  ): Promise<number> {
    return this.queryInstance().min(field as any)
  }

  public async create<I extends DreamClassTransactionBuilder<DreamInstance>>(
    this: I,
    opts?: UpdateableProperties<DreamInstance>
  ): Promise<DreamInstance> {
    const dream = (this.dreamInstance.constructor as typeof Dream).new(opts) as DreamInstance
    return saveDream<DreamInstance>(dream, this.dreamTransaction)
  }

  public async find<
    I extends DreamClassTransactionBuilder<DreamInstance>,
    Schema extends DreamInstance['dreamconf']['schema'],
    SchemaIdType = Schema[DreamInstance['table']]['columns'][DreamInstance['primaryKey']]['coercedType'],
  >(this: I, id: SchemaIdType): Promise<DreamInstance | null> {
    return await this.queryInstance()
      .where({ [this.dreamInstance.primaryKey]: id } as any)
      .first()
  }

  public async findBy<I extends DreamClassTransactionBuilder<DreamInstance>, DB extends DreamInstance['DB']>(
    this: I,
    attributes: Updateable<DB[DreamInstance['table']]>
  ): Promise<DreamInstance | null> {
    return await this.queryInstance()
      .where(attributes as any)
      .first()
  }

  public async findEach<I extends DreamClassTransactionBuilder<DreamInstance>>(
    this: I,
    cb: (instance: DreamInstance) => void | Promise<void>,
    opts?: FindEachOpts
  ): Promise<void> {
    await this.queryInstance().findEach(cb, opts)
  }

  public async first<I extends DreamClassTransactionBuilder<DreamInstance>>(
    this: I
  ): Promise<DreamInstance | null> {
    return this.queryInstance().first()
  }

  public async exists<I extends DreamClassTransactionBuilder<DreamInstance>>(this: I): Promise<boolean> {
    return this.queryInstance().exists()
  }

  public preload<
    I extends DreamClassTransactionBuilder<DreamInstance>,
    TableName extends DreamInstance['table'],
    Schema extends DreamInstance['dreamconf']['schema'],
    const Arr extends readonly unknown[],
  >(this: I, ...args: [...Arr, VariadicLoadArgs<Schema, TableName, Arr>]) {
    return this.queryInstance().preload(...(args as any))
  }

  public joins<
    I extends DreamClassTransactionBuilder<DreamInstance>,
    TableName extends DreamInstance['table'],
    DB extends DreamInstance['DB'],
    Schema extends DreamInstance['dreamconf']['schema'],
    const Arr extends readonly unknown[],
  >(this: I, ...args: [...Arr, VariadicJoinsArgs<DB, Schema, TableName, Arr>]) {
    return this.queryInstance().joins(...(args as any))
  }

  public async pluckThrough<
    I extends DreamClassTransactionBuilder<DreamInstance>,
    DB extends DreamInstance['DB'],
    Schema extends DreamInstance['dreamconf']['schema'],
    TableName extends DreamInstance['table'],
    const Arr extends readonly unknown[],
  >(this: I, ...args: [...Arr, VariadicPluckThroughArgs<DB, Schema, TableName, Arr>]) {
    return this.queryInstance().pluckThrough(...(args as any))
  }

  public async pluckEachThrough<
    I extends DreamClassTransactionBuilder<DreamInstance>,
    DB extends DreamInstance['DB'],
    Schema extends DreamInstance['dreamconf']['schema'],
    TableName extends DreamInstance['table'],
    const Arr extends readonly unknown[],
  >(this: I, ...args: [...Arr, VariadicPluckEachThroughArgs<DB, Schema, TableName, Arr>]): Promise<void> {
    return this.queryInstance().pluckEachThrough(...(args as any))
  }

  public queryInstance<I extends DreamClassTransactionBuilder<DreamInstance>>(this: I): Query<DreamInstance> {
    return new Query<DreamInstance>(this.dreamInstance).txn(this.dreamTransaction)
  }

  public unscoped<I extends DreamClassTransactionBuilder<DreamInstance>>(this: I): Query<DreamInstance> {
    return this.queryInstance().unscoped()
  }

  public async last<I extends DreamClassTransactionBuilder<DreamInstance>>(
    this: I
  ): Promise<DreamInstance | null> {
    return this.queryInstance().last()
  }

  public nestedSelect<
    I extends DreamClassTransactionBuilder<DreamInstance>,
    DB extends DreamInstance['DB'],
    SE extends SelectExpression<DB, ExtractTableAlias<DB, DreamInstance['table']>>,
  >(this: I, selection: SelectArg<DB, ExtractTableAlias<DB, DreamInstance['table']>, SE>) {
    return this.queryInstance().nestedSelect(selection as any)
  }

  public order<I extends DreamClassTransactionBuilder<DreamInstance>>(
    this: I,
    arg: DreamColumnNames<DreamInstance> | Partial<Record<DreamColumnNames<DreamInstance>, OrderDir>> | null
  ) {
    return this.queryInstance().order(arg as any)
  }

  public async pluck<
    I extends DreamClassTransactionBuilder<DreamInstance>,
    TableName extends DreamInstance['table'],
    ColumnType extends DreamColumnNames<DreamInstance>,
  >(this: I, ...fields: (ColumnType | `${TableName}.${ColumnType}`)[]) {
    return await this.queryInstance().pluck(...(fields as any[]))
  }

  public async pluckEach<
    I extends DreamClassTransactionBuilder<DreamInstance>,
    TableName extends DreamInstance['table'],
    ColumnType extends DreamColumnNames<DreamInstance>,
    CB extends (plucked: any) => void | Promise<void>,
  >(this: I, ...fields: (ColumnType | `${TableName}.${ColumnType}` | CB | FindEachOpts)[]): Promise<void> {
    await this.queryInstance().pluckEach(...fields)
  }

  public passthrough<
    I extends DreamClassTransactionBuilder<DreamInstance>,
    AllColumns extends DreamInstance['allColumns'],
  >(this: I, passthroughWhereStatement: PassthroughWhere<AllColumns>): Query<DreamInstance> {
    return this.queryInstance().passthrough(passthroughWhereStatement as any)
  }

  public where<
    I extends DreamClassTransactionBuilder<DreamInstance>,
    DB extends DreamInstance['DB'],
    Schema extends DreamInstance['dreamconf']['schema'],
    TableName extends AssociationTableNames<DB, Schema> & keyof DB = I['dreamInstance']['table'] & keyof DB,
  >(this: I, attributes: WhereStatement<DB, Schema, TableName>): Query<DreamInstance> {
    return this.queryInstance().where(attributes as any)
  }

  public whereAny<
    I extends DreamClassTransactionBuilder<DreamInstance>,
    DB extends DreamInstance['DB'],
    Schema extends DreamInstance['dreamconf']['schema'],
    TableName extends AssociationTableNames<DB, Schema> & keyof DB = I['dreamInstance']['table'] & keyof DB,
  >(this: I, attributes: WhereStatement<DB, Schema, TableName>[]): Query<DreamInstance> {
    return this.queryInstance().whereAny(attributes as any)
  }

  public whereNot<
    I extends DreamClassTransactionBuilder<DreamInstance>,
    DB extends DreamInstance['DB'],
    Schema extends DreamInstance['dreamconf']['schema'],
    TableName extends AssociationTableNames<DB, Schema> & keyof DB = I['dreamInstance']['table'] & keyof DB,
  >(this: I, attributes: WhereStatement<DB, Schema, TableName>): Query<DreamInstance> {
    return this.queryInstance().whereNot(attributes as any)
  }
}
