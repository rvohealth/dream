import { SelectArg, SelectExpression, Updateable } from 'kysely'
import { PassthroughWhere, WhereStatement } from '../decorators/associations/shared'
import Dream from '../dream'
import DreamTransaction from './transaction'
import Query, { FindEachOpts } from './query'
import { AssociationTableNames } from '../db/reflections'
import {
  PreloadArgumentTypeAssociatedTableNames,
  JoinsArgumentTypeAssociatedTableNames,
  NextJoinsWhereArgumentType,
  NextPreloadArgumentType,
  UpdateablePropertiesForClass,
  NextJoinsWherePluckArgumentType,
  FinalJoinsWherePluckArgumentType,
  GreaterThanOne,
  GreaterThanTwo,
  GreaterThanThree,
  GreaterThanFour,
  GreaterThanFive,
  GreaterThanSix,
  DreamClassColumns,
  OrderDir,
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
    //
    A extends NextPreloadArgumentType<SyncedAssociations, TableName>,
    ATableName extends PreloadArgumentTypeAssociatedTableNames<SyncedAssociations, TableName, A>,
    B extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanOne
      ? NextPreloadArgumentType<SyncedAssociations, ATableName>
      : any,
    BTableName extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanOne
      ? PreloadArgumentTypeAssociatedTableNames<SyncedAssociations, ATableName, B>
      : never,
    C extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanTwo
      ? NextPreloadArgumentType<SyncedAssociations, BTableName>
      : any,
    CTableName extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanTwo
      ? PreloadArgumentTypeAssociatedTableNames<SyncedAssociations, BTableName, C>
      : never,
    D extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanThree
      ? NextPreloadArgumentType<SyncedAssociations, CTableName>
      : any,
    DTableName extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanThree
      ? PreloadArgumentTypeAssociatedTableNames<SyncedAssociations, CTableName, D>
      : never,
    E extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanFour
      ? NextPreloadArgumentType<SyncedAssociations, DTableName>
      : any,
    ETableName extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanFour
      ? PreloadArgumentTypeAssociatedTableNames<SyncedAssociations, DTableName, E>
      : never,
    F extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanFive
      ? NextPreloadArgumentType<SyncedAssociations, ETableName>
      : any,
    FTableName extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanFive
      ? PreloadArgumentTypeAssociatedTableNames<SyncedAssociations, ETableName, F>
      : any,
    G extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanSix
      ? NextPreloadArgumentType<SyncedAssociations, FTableName>
      : any,
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
    B extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanOne
      ? NextJoinsWhereArgumentType<DB, SyncedAssociations, ATableName>
      : any,
    BTableName extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanOne
      ? JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, ATableName, B>
      : never,
    C extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanTwo
      ? NextJoinsWhereArgumentType<DB, SyncedAssociations, BTableName>
      : any,
    CTableName extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanTwo
      ? JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, BTableName, C>
      : never,
    D extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanThree
      ? NextJoinsWhereArgumentType<DB, SyncedAssociations, CTableName>
      : any,
    DTableName extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanThree
      ? JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, CTableName, D>
      : never,
    E extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanFour
      ? NextJoinsWhereArgumentType<DB, SyncedAssociations, DTableName>
      : any,
    ETableName extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanFour
      ? JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, DTableName, E>
      : never,
    F extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanFive
      ? NextJoinsWhereArgumentType<DB, SyncedAssociations, ETableName>
      : any,
    FTableName extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanFive
      ? JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, ETableName, F>
      : never,
    G extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanSix
      ? NextJoinsWhereArgumentType<DB, SyncedAssociations, FTableName>
      : never,
  >(this: I, a: A, b?: B, c?: C, d?: D, e?: E, f?: F, g?: G) {
    return this.queryInstance().joins(a as any, b as any, c as any, d as any, e as any, f as any, g as any)
  }

  public async pluckThrough<
    I extends DreamClassTransactionBuilder<DreamClass>,
    DB extends InstanceType<DreamClass>['DB'],
    SyncedAssociations extends InstanceType<DreamClass>['syncedAssociations'],
    TableName extends InstanceType<DreamClass>['table'],
    //
    A extends keyof SyncedAssociations[TableName] & string,
    ATableName extends (SyncedAssociations[TableName][A & keyof SyncedAssociations[TableName]] &
      string[])[number],
    //
    B extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanOne
      ? NextJoinsWherePluckArgumentType<DB, SyncedAssociations, A, A, ATableName>
      : any,
    BTableName extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanOne
      ? JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, ATableName, B>
      : never,
    C extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanTwo
      ? NextJoinsWherePluckArgumentType<DB, SyncedAssociations, B, A, BTableName>
      : any,
    CTableName extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanTwo
      ? JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, BTableName, C>
      : never,
    D extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanThree
      ? CTableName extends never
        ? never
        : NextJoinsWherePluckArgumentType<DB, SyncedAssociations, C, B, CTableName>
      : any,
    DTableName extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanThree
      ? CTableName extends never
        ? never
        : JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, CTableName, D>
      : never,
    E extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanFour
      ? DTableName extends never
        ? never
        : NextJoinsWherePluckArgumentType<DB, SyncedAssociations, D, C, DTableName>
      : any,
    ETableName extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanFour
      ? DTableName extends never
        ? never
        : JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, DTableName, E>
      : never,
    F extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanFive
      ? ETableName extends never
        ? never
        : NextJoinsWherePluckArgumentType<DB, SyncedAssociations, E, D, ETableName>
      : any,
    FTableName extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanFive
      ? ETableName extends never
        ? never
        : JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, ETableName, F>
      : never,
    //
    G extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanSix
      ? FTableName extends never
        ? never
        : FinalJoinsWherePluckArgumentType<DB, SyncedAssociations, F, E, FTableName>
      : any,
  >(this: I, a: A, b: B, c?: C, d?: D, e?: E, f?: F, g?: G) {
    return this.queryInstance().pluckThrough(a, b, c as any, d as any, e as any, f as any, g as any)
  }

  public async pluckEachThrough<
    I extends InstanceType<DreamClass>,
    DB extends I['DB'],
    SyncedAssociations extends I['syncedAssociations'],
    TableName extends I['table'],
    CB extends (data: any | any[]) => void | Promise<void>,
    //
    A extends keyof SyncedAssociations[TableName] & string,
    ATableName extends (SyncedAssociations[TableName][A & keyof SyncedAssociations[TableName]] &
      string[])[number],
    //
    B extends I['maxAssociationTypeDepth'] extends GreaterThanOne
      ? NextJoinsWherePluckArgumentType<DB, SyncedAssociations, A, A, ATableName>
      : any,
    BTableName extends I['maxAssociationTypeDepth'] extends GreaterThanOne
      ? JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, ATableName, B>
      : never,
    C extends I['maxAssociationTypeDepth'] extends GreaterThanTwo
      ? NextJoinsWherePluckArgumentType<DB, SyncedAssociations, B, A, BTableName>
      : any,
    CTableName extends I['maxAssociationTypeDepth'] extends GreaterThanTwo
      ? JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, BTableName, C>
      : never,
    D extends I['maxAssociationTypeDepth'] extends GreaterThanThree
      ? CTableName extends never
        ? never
        : NextJoinsWherePluckArgumentType<DB, SyncedAssociations, C, B, CTableName>
      : any,
    DTableName extends I['maxAssociationTypeDepth'] extends GreaterThanThree
      ? CTableName extends never
        ? never
        : JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, CTableName, D>
      : never,
    E extends I['maxAssociationTypeDepth'] extends GreaterThanFour
      ? DTableName extends never
        ? never
        : NextJoinsWherePluckArgumentType<DB, SyncedAssociations, D, C, DTableName>
      : any,
    ETableName extends I['maxAssociationTypeDepth'] extends GreaterThanFour
      ? DTableName extends never
        ? never
        : JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, DTableName, E>
      : never,
    F extends I['maxAssociationTypeDepth'] extends GreaterThanFive
      ? ETableName extends never
        ? never
        : NextJoinsWherePluckArgumentType<DB, SyncedAssociations, E, D, ETableName>
      : any,
    FTableName extends I['maxAssociationTypeDepth'] extends GreaterThanFive
      ? ETableName extends never
        ? never
        : JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, ETableName, F>
      : never,
    //
    G extends I['maxAssociationTypeDepth'] extends GreaterThanSix
      ? FTableName extends never
        ? never
        : FinalJoinsWherePluckArgumentType<DB, SyncedAssociations, F, E, FTableName>
      : any,
  >(
    a: A,
    b: B | CB,
    c?: C | CB | FindEachOpts,
    d?: D | CB | FindEachOpts,
    e?: E | CB | FindEachOpts,
    f?: F | CB | FindEachOpts,
    g?: G | CB | FindEachOpts,
    cb?: CB,
    opts?: FindEachOpts
  ) {
    return this.queryInstance().pluckEachThrough(
      a,
      b,
      c as any,
      d as any,
      e as any,
      f as any,
      g as any,
      cb,
      opts
    )
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
