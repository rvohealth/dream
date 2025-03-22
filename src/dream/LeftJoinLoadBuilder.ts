import Dream from '../Dream.js'
import { PassthroughOnClause } from '../types/associations.js'
import { IdType, PassthroughColumnNames } from '../types/dream.js'
import { VariadicLeftJoinLoadArgs } from '../types/variadic.js'
import DreamTransaction from './DreamTransaction.js'
import Query, {
  PreloadedDreamsAndWhatTheyPointTo,
  QueryWithJoinedAssociationsTypeAndNoPreload,
} from './Query.js'

export default class LeftJoinLoadBuilder<DreamInstance extends Dream> {
  private dream: Dream
  private dreamTransaction: DreamTransaction<any> | undefined
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
  constructor(dream: Dream, txn?: DreamTransaction<any>) {
    this.dream = dream['clone']()

    // Load queries start from the table corresponding to an instance
    // of a Dream. However, the Dream may have default scopes that would
    // preclude finding that instance, so the Query that forms the base of
    // a load must be unscoped, but that unscoping should not carry through
    // to other associations (thus the use of `removeAllDefaultScopesExceptOnAssociations`
    // instead of `removeAllDefaultScopes`).
    this.query = (this.dream as any).query()['removeAllDefaultScopesExceptOnAssociations']()
    this.dreamTransaction = txn
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

    Object.keys(this.query['leftJoinStatements']).forEach(associationName => {
      this.query['hydrateAssociation'](
        [this.dream],
        this.dream['getAssociationMetadata'](associationName),
        this.associationToPreloadedDreamsAndWhatTheyPointTo({
          pointsToPrimaryKey: this.dream.primaryKeyValue,
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
    pointsToPrimaryKey: IdType
    associatedModels: Dream | Dream[]
  }): PreloadedDreamsAndWhatTheyPointTo[] {
    return [associatedModels].flat().map(dream => ({ dream, pointsToPrimaryKey }))
  }
}
