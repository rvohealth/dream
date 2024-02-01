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
} from './types'
import associationQuery from './internal/associations/associationQuery'
import associationUpdateQuery from './internal/associations/associationUpdateQuery'
import createAssociation from './internal/associations/createAssociation'
import reload from './internal/reload'
import destroyAssociation from './internal/associations/destroyAssociation'
import Query, { FindEachOpts } from './query'

export default class DreamInstanceTransactionBuilder<DreamInstance extends Dream> {
  public dreamInstance: DreamInstance
  public dreamTransaction: DreamTransaction<DreamInstance['DB']>
  constructor(dreamInstance: DreamInstance, txn: DreamTransaction<DreamInstance['DB']>) {
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
      ? NextJoinsWherePluckArgumentType<DB, SyncedAssociations, C, B, CTableName>
      : any,
    DTableName extends DreamInstance['maxAssociationTypeDepth'] extends GreaterThanThree
      ? JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, CTableName, D>
      : never,
    E extends DreamInstance['maxAssociationTypeDepth'] extends GreaterThanFour
      ? NextJoinsWherePluckArgumentType<DB, SyncedAssociations, D, C, DTableName>
      : any,
    ETableName extends DreamInstance['maxAssociationTypeDepth'] extends GreaterThanFour
      ? JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, DTableName, E>
      : never,
    F extends DreamInstance['maxAssociationTypeDepth'] extends GreaterThanFive
      ? NextJoinsWherePluckArgumentType<DB, SyncedAssociations, E, D, ETableName>
      : any,
    FTableName extends DreamInstance['maxAssociationTypeDepth'] extends GreaterThanFive
      ? JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, ETableName, F>
      : never,
    //
    G extends DreamInstance['maxAssociationTypeDepth'] extends GreaterThanSix
      ? FinalJoinsWherePluckArgumentType<DB, SyncedAssociations, F, E, FTableName>
      : any
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
      ? NextJoinsWherePluckArgumentType<DB, SyncedAssociations, C, B, CTableName>
      : any,
    DTableName extends DreamInstance['maxAssociationTypeDepth'] extends GreaterThanThree
      ? JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, CTableName, D>
      : never,
    E extends DreamInstance['maxAssociationTypeDepth'] extends GreaterThanFour
      ? NextJoinsWherePluckArgumentType<DB, SyncedAssociations, D, C, DTableName>
      : any,
    ETableName extends DreamInstance['maxAssociationTypeDepth'] extends GreaterThanFour
      ? JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, DTableName, E>
      : never,
    F extends DreamInstance['maxAssociationTypeDepth'] extends GreaterThanFive
      ? NextJoinsWherePluckArgumentType<DB, SyncedAssociations, E, D, ETableName>
      : any,
    FTableName extends DreamInstance['maxAssociationTypeDepth'] extends GreaterThanFive
      ? JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, ETableName, F>
      : never,
    //
    G extends DreamInstance['maxAssociationTypeDepth'] extends GreaterThanSix
      ? FinalJoinsWherePluckArgumentType<DB, SyncedAssociations, F, E, FTableName>
      : any
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

  public async destroy<I extends DreamInstanceTransactionBuilder<DreamInstance>>(
    this: I
  ): Promise<DreamInstance> {
    return destroyDream(this.dreamInstance, this.dreamTransaction)
  }

  public async update<I extends DreamInstanceTransactionBuilder<DreamInstance>>(
    this: I,
    attributes: UpdateableProperties<DreamInstance>
  ): Promise<DreamInstance> {
    this.dreamInstance.setAttributes(attributes)
    return saveDream(this.dreamInstance, this.dreamTransaction)
  }

  public async updateAttributes<I extends DreamInstanceTransactionBuilder<DreamInstance>>(
    this: I,
    attributes: UpdateableProperties<DreamInstance>
  ): Promise<DreamInstance> {
    this.dreamInstance['_setAttributes'](attributes, { bypassUserDefinedSetters: true })
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
    AssociationName extends keyof DreamInstance['syncedAssociations'][DreamInstance['table']]
  >(this: I, associationName: AssociationName): any {
    return associationQuery(this.dreamInstance, this.dreamTransaction, associationName)
  }

  public associationUpdateQuery<
    I extends DreamInstanceTransactionBuilder<DreamInstance>,
    AssociationName extends keyof DreamInstance['syncedAssociations'][DreamInstance['table']]
  >(this: I, associationName: AssociationName): any {
    return associationUpdateQuery(this.dreamInstance, this.dreamTransaction, associationName)
  }

  public async createAssociation<
    I extends DreamInstanceTransactionBuilder<DreamInstance>,
    AssociationName extends keyof DreamInstance['syncedAssociations'][DreamInstance['table']],
    PossibleArrayAssociationType = DreamInstance[AssociationName & keyof DreamInstance],
    AssociationType = PossibleArrayAssociationType extends (infer ElementType)[]
      ? ElementType
      : PossibleArrayAssociationType
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
      : PossibleArrayAssociationType
  >(
    this: I,
    associationName: AssociationName,
    opts: UpdateablePropertiesForClass<AssociationType & typeof Dream> = {}
  ): Promise<number> {
    return await destroyAssociation(this.dreamInstance, this.dreamTransaction, associationName, opts)
  }

  private queryInstance<
    I extends DreamInstanceTransactionBuilder<DreamInstance>,
    DreamClass extends DreamConstructorType<DreamInstance>
  >(this: I): Query<DreamClass> {
    const dreamClass = this.dreamInstance.constructor as DreamClass
    const id = this.dreamInstance.primaryKeyValue

    return dreamClass.txn(this.dreamTransaction).where({ [this.dreamInstance.primaryKey]: id } as any)
  }
}
