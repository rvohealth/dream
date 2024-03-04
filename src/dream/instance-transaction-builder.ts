import Dream from '../dream'
import DreamTransaction from './transaction'
import saveDream from './internal/saveDream'
import destroyDream from './internal/destroyDream'
import {
  UpdateablePropertiesForClass,
  UpdateableProperties,
  DreamConstructorType,
  NextJoinsWherePluckArgumentType,
  JoinsArgumentTypeAssociatedTableNames,
  FinalJoinsWherePluckArgumentType,
  GreaterThanOne,
  GreaterThanTwo,
  GreaterThanThree,
  GreaterThanFour,
  GreaterThanFive,
  GreaterThanSix,
  NextPreloadArgumentType,
  PreloadArgumentTypeAssociatedTableNames,
} from './types'
import associationQuery from './internal/associations/associationQuery'
import associationUpdateQuery from './internal/associations/associationUpdateQuery'
import createAssociation from './internal/associations/createAssociation'
import reload from './internal/reload'
import destroyAssociation from './internal/associations/destroyAssociation'
import Query, { FindEachOpts } from './query'
import LoadBuilder from './load-builder'

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
    //
    A extends keyof SyncedAssociations[TableName] & string,
    ATableName extends (SyncedAssociations[TableName][A & keyof SyncedAssociations[TableName]] &
      string[])[number],
    //
    B extends DreamInstance['maxAssociationTypeDepth'] extends GreaterThanOne
      ? NextJoinsWherePluckArgumentType<DB, SyncedAssociations, A, A, ATableName>
      : any,
    BTableName extends DreamInstance['maxAssociationTypeDepth'] extends GreaterThanOne
      ? JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, ATableName, B>
      : never,
    C extends DreamInstance['maxAssociationTypeDepth'] extends GreaterThanTwo
      ? NextJoinsWherePluckArgumentType<DB, SyncedAssociations, B, A, BTableName>
      : any,
    CTableName extends DreamInstance['maxAssociationTypeDepth'] extends GreaterThanTwo
      ? JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, BTableName, C>
      : never,
    D extends DreamInstance['maxAssociationTypeDepth'] extends GreaterThanThree
      ? CTableName extends never
        ? never
        : NextJoinsWherePluckArgumentType<DB, SyncedAssociations, C, B, CTableName>
      : any,
    DTableName extends DreamInstance['maxAssociationTypeDepth'] extends GreaterThanThree
      ? CTableName extends never
        ? never
        : JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, CTableName, D>
      : never,
    E extends DreamInstance['maxAssociationTypeDepth'] extends GreaterThanFour
      ? DTableName extends never
        ? never
        : NextJoinsWherePluckArgumentType<DB, SyncedAssociations, D, C, DTableName>
      : any,
    ETableName extends DreamInstance['maxAssociationTypeDepth'] extends GreaterThanFour
      ? DTableName extends never
        ? never
        : JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, DTableName, E>
      : never,
    F extends DreamInstance['maxAssociationTypeDepth'] extends GreaterThanFive
      ? ETableName extends never
        ? never
        : NextJoinsWherePluckArgumentType<DB, SyncedAssociations, E, D, ETableName>
      : any,
    FTableName extends DreamInstance['maxAssociationTypeDepth'] extends GreaterThanFive
      ? ETableName extends never
        ? never
        : JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, ETableName, F>
      : never,
    //
    G extends DreamInstance['maxAssociationTypeDepth'] extends GreaterThanSix
      ? FTableName extends never
        ? never
        : FinalJoinsWherePluckArgumentType<DB, SyncedAssociations, F, E, FTableName>
      : any,
  >(this: I, a: A, b: B, c?: C, d?: D, e?: E, f?: F, g?: G) {
    return this.queryInstance().pluckThrough(a, b, c as any, d as any, e as any, f as any, g as any)
  }

  public async pluckEachThrough<
    I extends DreamInstanceTransactionBuilder<DreamInstance>,
    DreamClass extends DreamConstructorType<DreamInstance>,
    DB extends DreamInstance['DB'],
    SyncedAssociations extends DreamInstance['syncedAssociations'],
    TableName extends DreamInstance['table'],
    CB extends (data: any | any[]) => void | Promise<void>,
    //
    A extends keyof SyncedAssociations[TableName] & string,
    ATableName extends (SyncedAssociations[TableName][A & keyof SyncedAssociations[TableName]] &
      string[])[number],
    //
    B extends DreamInstance['maxAssociationTypeDepth'] extends GreaterThanOne
      ? NextJoinsWherePluckArgumentType<DB, SyncedAssociations, A, A, ATableName>
      : any,
    BTableName extends DreamInstance['maxAssociationTypeDepth'] extends GreaterThanOne
      ? JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, ATableName, B>
      : never,
    C extends DreamInstance['maxAssociationTypeDepth'] extends GreaterThanTwo
      ? NextJoinsWherePluckArgumentType<DB, SyncedAssociations, B, A, BTableName>
      : any,
    CTableName extends DreamInstance['maxAssociationTypeDepth'] extends GreaterThanTwo
      ? JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, BTableName, C>
      : never,
    D extends DreamInstance['maxAssociationTypeDepth'] extends GreaterThanThree
      ? CTableName extends never
        ? never
        : NextJoinsWherePluckArgumentType<DB, SyncedAssociations, C, B, CTableName>
      : any,
    DTableName extends DreamInstance['maxAssociationTypeDepth'] extends GreaterThanThree
      ? CTableName extends never
        ? never
        : JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, CTableName, D>
      : never,
    E extends DreamInstance['maxAssociationTypeDepth'] extends GreaterThanFour
      ? DTableName extends never
        ? never
        : NextJoinsWherePluckArgumentType<DB, SyncedAssociations, D, C, DTableName>
      : any,
    ETableName extends DreamInstance['maxAssociationTypeDepth'] extends GreaterThanFour
      ? DTableName extends never
        ? never
        : JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, DTableName, E>
      : never,
    F extends DreamInstance['maxAssociationTypeDepth'] extends GreaterThanFive
      ? ETableName extends never
        ? never
        : NextJoinsWherePluckArgumentType<DB, SyncedAssociations, E, D, ETableName>
      : any,
    FTableName extends DreamInstance['maxAssociationTypeDepth'] extends GreaterThanFive
      ? ETableName extends never
        ? never
        : JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, ETableName, F>
      : never,
    //
    G extends DreamInstance['maxAssociationTypeDepth'] extends GreaterThanSix
      ? FTableName extends never
        ? never
        : FinalJoinsWherePluckArgumentType<DB, SyncedAssociations, F, E, FTableName>
      : any,
  >(
    this: I,
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

  public load<
    I extends DreamInstanceTransactionBuilder<DreamInstance>,
    TableName extends DreamInstance['table'],
    SyncedAssociations extends DreamInstance['syncedAssociations'],
    //
    A extends NextPreloadArgumentType<SyncedAssociations, TableName>,
    ATableName extends PreloadArgumentTypeAssociatedTableNames<SyncedAssociations, TableName, A>,
    B extends DreamInstance['maxAssociationTypeDepth'] extends GreaterThanOne
      ? NextPreloadArgumentType<SyncedAssociations, ATableName>
      : any,
    BTableName extends DreamInstance['maxAssociationTypeDepth'] extends GreaterThanOne
      ? PreloadArgumentTypeAssociatedTableNames<SyncedAssociations, ATableName, B>
      : never,
    C extends DreamInstance['maxAssociationTypeDepth'] extends GreaterThanTwo
      ? BTableName extends never
        ? never
        : NextPreloadArgumentType<SyncedAssociations, BTableName>
      : any,
    CTableName extends DreamInstance['maxAssociationTypeDepth'] extends GreaterThanTwo
      ? PreloadArgumentTypeAssociatedTableNames<SyncedAssociations, BTableName, C>
      : never,
    D extends DreamInstance['maxAssociationTypeDepth'] extends GreaterThanThree
      ? CTableName extends never
        ? never
        : NextPreloadArgumentType<SyncedAssociations, CTableName>
      : any,
    DTableName extends DreamInstance['maxAssociationTypeDepth'] extends GreaterThanThree
      ? CTableName extends never
        ? never
        : PreloadArgumentTypeAssociatedTableNames<SyncedAssociations, CTableName, D>
      : never,
    E extends DreamInstance['maxAssociationTypeDepth'] extends GreaterThanFour
      ? DTableName extends never
        ? never
        : NextPreloadArgumentType<SyncedAssociations, DTableName>
      : any,
    ETableName extends DreamInstance['maxAssociationTypeDepth'] extends GreaterThanFive
      ? DTableName extends never
        ? never
        : PreloadArgumentTypeAssociatedTableNames<SyncedAssociations, DTableName, E>
      : never,
    F extends DreamInstance['maxAssociationTypeDepth'] extends GreaterThanFive
      ? ETableName extends never
        ? never
        : NextPreloadArgumentType<SyncedAssociations, ETableName>
      : any,
    FTableName extends DreamInstance['maxAssociationTypeDepth'] extends GreaterThanFive
      ? ETableName extends never
        ? never
        : PreloadArgumentTypeAssociatedTableNames<SyncedAssociations, ETableName, F>
      : never,
    G extends DreamInstance['maxAssociationTypeDepth'] extends GreaterThanSix
      ? FTableName extends never
        ? never
        : NextPreloadArgumentType<SyncedAssociations, FTableName>
      : any,
  >(this: I, a: A, b?: B, c?: C, d?: D, e?: E, f?: F, g?: G): LoadBuilder<DreamInstance> {
    return new LoadBuilder<DreamInstance>(this.dreamInstance, this.dreamTransaction).load(
      a as any,
      b as any,
      c as any,
      d as any,
      e as any,
      f as any,
      g as any
    )
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
  >(
    this: I,
    associationName: AssociationName,
    opts: UpdateablePropertiesForClass<AssociationType & typeof Dream> = {}
  ): Promise<NonNullable<AssociationType>> {
    return await createAssociation(this.dreamInstance, this.dreamTransaction, associationName, opts)
  }

  public async destroyAssociation<
    I extends DreamInstanceTransactionBuilder<DreamInstance>,
    AssociationName extends keyof DreamInstance['syncedAssociations'][DreamInstance['table']],
    PossibleArrayAssociationType = DreamInstance[AssociationName & keyof DreamInstance],
    AssociationType = PossibleArrayAssociationType extends (infer ElementType)[]
      ? ElementType
      : PossibleArrayAssociationType,
  >(
    this: I,
    associationName: AssociationName,
    opts: UpdateablePropertiesForClass<AssociationType & typeof Dream> = {}
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
