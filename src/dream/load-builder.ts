import Dream from '../dream'
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
    A extends NextPreloadArgumentType<DreamInstance['syncedAssociations'], TableName>,
    ATableName extends PreloadArgumentTypeAssociatedTableNames<
      DreamInstance['syncedAssociations'],
      TableName,
      A
    >,
    B extends NextPreloadArgumentType<DreamInstance['syncedAssociations'], ATableName>,
    BTableName extends PreloadArgumentTypeAssociatedTableNames<
      DreamInstance['syncedAssociations'],
      ATableName,
      B
    >,
    C extends NextPreloadArgumentType<DreamInstance['syncedAssociations'], BTableName>,
    CTableName extends PreloadArgumentTypeAssociatedTableNames<
      DreamInstance['syncedAssociations'],
      BTableName,
      C
    >,
    D extends NextPreloadArgumentType<DreamInstance['syncedAssociations'], CTableName>,
    DTableName extends PreloadArgumentTypeAssociatedTableNames<
      DreamInstance['syncedAssociations'],
      CTableName,
      D
    >,
    E extends NextPreloadArgumentType<DreamInstance['syncedAssociations'], DTableName>,
    ETableName extends PreloadArgumentTypeAssociatedTableNames<
      DreamInstance['syncedAssociations'],
      DTableName,
      E
    >,
    F extends NextPreloadArgumentType<DreamInstance['syncedAssociations'], ETableName>,
    FTableName extends PreloadArgumentTypeAssociatedTableNames<
      DreamInstance['syncedAssociations'],
      ETableName,
      F
    >,
    //
    G extends NextPreloadArgumentType<DreamInstance['syncedAssociations'], FTableName>
  >(this: I, a: A, b?: B, c?: C, d?: D, e?: E, f?: F, g?: G) {
    this.query = this.query.preload(a as any, b as any, c as any, d as any, e as any, f as any, g as any)
    return this
  }

  public async execute(): Promise<void> {
    await this.query.hydratePreload(this.dream)
  }
}
