import Dream from '../dream'
import { SyncedAssociationNames, SyncedAssociations } from '../sync/associations'
import Query from './query'
import {
  DreamConstructorType,
  NextPreloadArgumentType,
  PreloadArgumentTypeAssociatedTableNames,
} from './types'

export default class LoadBuilder<DreamInstance extends Dream> {
  private dream: Dream
  private query: Query<DreamConstructorType<DreamInstance>>

  constructor(dream: Dream) {
    this.dream = dream
    const base = this.dream.constructor as DreamConstructorType<DreamInstance>
    this.query = new Query<DreamConstructorType<DreamInstance>>(base)
  }

  public load<
    I extends LoadBuilder<DreamInstance>,
    TableName extends DreamInstance['table'],
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
      : (keyof SyncedAssociationNames[FTableName & keyof SyncedAssociations] & string)[]
  >(this: I, a: A, b?: B, c?: C, d?: D, e?: E, f?: F, g?: G) {
    this.query = this.query.preload(a as any, b as any, c as any, d as any, e as any, f as any, g as any)
    return this
  }

  public async execute(): Promise<void> {
    await this.query.hydratePreload(this.dream)
  }
}
