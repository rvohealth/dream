import Dream from '../Dream.js'
import { type PassthroughOnClause } from '../types/associations/shared.js'
import { type PassthroughColumnNames } from '../types/dream.js'
import { type QueryWithJoinedAssociationsTypeAndNoLeftJoinPreload } from '../types/query.js'
import { type VariadicLoadArgs } from '../types/variadic.js'
import DreamTransaction from './DreamTransaction.js'
import Query from './Query.js'

export default class LoadBuilder<DreamInstance extends Dream> {
  private dream: Dream
  private dreamTransaction: DreamTransaction<any> | undefined
  private query: QueryWithJoinedAssociationsTypeAndNoLeftJoinPreload<Query<DreamInstance>>

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
    I extends LoadBuilder<DreamInstance>,
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
  public load<
    I extends LoadBuilder<DreamInstance>,
    DB extends DreamInstance['DB'],
    TableName extends DreamInstance['table'],
    Schema extends DreamInstance['schema'],
    const Arr extends readonly unknown[],
  >(this: I, ...args: [...Arr, VariadicLoadArgs<DB, Schema, TableName, Arr>]) {
    this.query = this.query.preload(...(args as any))
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

    await this.query['hydratePreload'](this.dream)
    return this.dream as DreamInstance
  }
}
