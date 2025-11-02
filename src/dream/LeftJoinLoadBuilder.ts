import Dream from '../Dream.js'
import UnexpectedUndefined from '../errors/UnexpectedUndefined.js'
import { PassthroughOnClause } from '../types/associations/shared.js'
import { PassthroughColumnNames } from '../types/dream.js'
import {
  PreloadedDreamsAndWhatTheyPointTo,
  QueryWithJoinedAssociationsTypeAndNoPreload,
} from '../types/query.js'
import { VariadicLeftJoinLoadArgs } from '../types/variadic.js'
import DreamTransaction from './DreamTransaction.js'
import unaliasTableName from './internal/unaliasTableName.js'
import Query from './Query.js'

export default class LeftJoinLoadBuilder<DreamInstance extends Dream> {
  private dream: Dream
  private query: QueryWithJoinedAssociationsTypeAndNoPreload<Query<DreamInstance>>

  /**
   * An intermediate class on the way to executing a load
   * query. this can be accessed on an instance of a dream
   * model by using the `#load` method:
   *
   * ```ts
   * const user = await User.firstOrFail()
   * await user.load('settings').execute()
   * ```
   */
  constructor(
    dream: Dream,
    private dreamTransaction?: DreamTransaction<any> | null
  ) {
    this.dream = dream['clone']()
    this.query = (this.dream as any).query()
  }

  public passthrough<
    I extends LeftJoinLoadBuilder<DreamInstance>,
    PassthroughColumns extends PassthroughColumnNames<DreamInstance>,
  >(this: I, passthroughWhereStatement: PassthroughOnClause<PassthroughColumns>) {
    this.query = this.query.passthrough(passthroughWhereStatement)
    return this
  }

  /**
   * Attaches a load statement to the load builder
   *
   * ```ts
   * const user = await User.firstOrFail()
   * await user
   *   .load('settings')
   *   .load('posts', 'comments', 'replies', ['image', 'localizedText'])
   *   .execute()
   * ```
   */
  public leftJoinLoad<
    I extends LeftJoinLoadBuilder<DreamInstance>,
    DB extends DreamInstance['DB'],
    TableName extends DreamInstance['table'],
    Schema extends DreamInstance['schema'],
    const Arr extends readonly unknown[],
    const LastArg extends VariadicLeftJoinLoadArgs<DB, Schema, TableName, Arr>,
  >(this: I, ...args: [...Arr, LastArg]) {
    this.query = this.query.leftJoinPreload(...(args as any))

    return this
  }

  /**
   * executes a load builder query, binding
   * all associations to their respective model
   * instances.
   *
   * ```ts
   * const user = await User.firstOrFail()
   * await user
   *   .load('settings')
   *   .load('posts', 'comments', 'replies', ['image', 'localizedText'])
   *   .execute()
   * ```
   */
  public async execute(): Promise<DreamInstance> {
    if (this.dreamTransaction) {
      this.query = this.query.txn(this.dreamTransaction)
    }

    const dreamWithLoadedAssociations = await this.query.firstOrFail()

    Object.keys(this.query['leftJoinStatements']).forEach(aliasedAssociationName => {
      const associationName = unaliasTableName(aliasedAssociationName)
      const associationMetadata = this.dream['getAssociationMetadata'](associationName)
      if (associationMetadata === undefined) throw new UnexpectedUndefined()

      this.query.dbDriverInstance()['hydrateAssociation'](
        [this.dream],
        associationMetadata,
        this.associationToPreloadedDreamsAndWhatTheyPointTo({
          pointsToPrimaryKey: this.dream.primaryKeyValue(),
          associatedModels: (dreamWithLoadedAssociations as any)[associationName] as Dream | Dream[],
        })
      )
    })

    return this.dream as DreamInstance
  }

  private associationToPreloadedDreamsAndWhatTheyPointTo({
    pointsToPrimaryKey,
    associatedModels,
  }: {
    pointsToPrimaryKey: string | number
    associatedModels: Dream | Dream[]
  }): PreloadedDreamsAndWhatTheyPointTo[] {
    return [associatedModels].flat().map(dream => ({ dream, pointsToPrimaryKey }))
  }
}
