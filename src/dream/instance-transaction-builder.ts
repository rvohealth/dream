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
} from './types'
import associationQuery from './internal/associations/associationQuery'
import associationUpdateQuery from './internal/associations/associationUpdateQuery'
import createAssociation from './internal/associations/createAssociation'
import reload from './internal/reload'
import destroyAssociation from './internal/associations/destroyAssociation'
import Query from './query'

export default class DreamInstanceTransactionBuilder<DreamInstance extends Dream> {
  public dreamInstance: DreamInstance
  public dreamTransaction: DreamTransaction<DreamInstance['DB']>
  constructor(dreamInstance: DreamInstance, txn: DreamTransaction<DreamInstance['DB']>) {
    this.dreamInstance = dreamInstance
    this.dreamTransaction = txn
  }

  public async joinsPluck<
    I extends DreamInstanceTransactionBuilder<DreamInstance>,
    DreamClass extends DreamConstructorType<DreamInstance>,
    DB extends DreamInstance['DB'],
    SyncedAssociations extends DreamInstance['syncedAssociations'],
    TableName extends DreamInstance['table'],
    //
    A extends keyof SyncedAssociations[TableName] & string,
    ATableName extends (SyncedAssociations[TableName][A & keyof SyncedAssociations[TableName]] &
      string[])[number],
    //
    B extends NextJoinsWherePluckArgumentType<DB, SyncedAssociations, A, A, ATableName>,
    BTableName extends JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, ATableName, B>,
    C extends NextJoinsWherePluckArgumentType<DB, SyncedAssociations, B, A, BTableName>,
    CTableName extends JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, BTableName, C>,
    D extends NextJoinsWherePluckArgumentType<DB, SyncedAssociations, C, B, CTableName>,
    DTableName extends JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, CTableName, D>,
    E extends NextJoinsWherePluckArgumentType<DB, SyncedAssociations, D, C, DTableName>,
    ETableName extends JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, DTableName, E>,
    F extends NextJoinsWherePluckArgumentType<DB, SyncedAssociations, E, D, ETableName>,
    FTableName extends JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, ETableName, F>,
    //
    G extends FinalJoinsWherePluckArgumentType<DB, SyncedAssociations, F, E, FTableName>
  >(this: I, a: A, b: B, c?: C, d?: D, e?: E, f?: F, g?: G) {
    const dreamClass = this.dreamInstance.constructor as DreamClass
    const id = this.dreamInstance.primaryKeyValue

    return dreamClass
      .txn(this.dreamTransaction)
      .where({ [this.dreamInstance.primaryKey]: id } as any)
      .joinsPluck(a, b, c as any, d as any, e as any, f as any, g as any)
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
}
