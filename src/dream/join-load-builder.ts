import { PassthroughWhere } from '../decorators/associations/shared'
import Dream from '../dream'
import Query from './query'
import DreamTransaction from './transaction'
import { PassthroughColumnNames, VariadicLoadArgs } from './types'

export default class JoinLoadBuilder<DreamInstance extends Dream> {
  private dream: Dream
  private dreamTransaction: DreamTransaction<any> | undefined
  private query: Query<DreamInstance>

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
    this.dream = dream

    // Load queries start from the table corresponding to an instance
    // of a Dream. However, the Dream may have default scopes that would
    // preclude finding that instance, so the Query that forms the base of
    // a load must be unscoped, but that unscoping should not carry through
    // to other associations (thus the use of `removeAllDefaultScopesExceptOnAssociations`
    // instead of `removeAllDefaultScopes`).
    this.query = new Query<DreamInstance>(this.dream as DreamInstance)[
      'removeAllDefaultScopesExceptOnAssociations'
    ]()
    this.dreamTransaction = txn
  }

  public passthrough<
    I extends JoinLoadBuilder<DreamInstance>,
    PassthroughColumns extends PassthroughColumnNames<DreamInstance>,
  >(this: I, passthroughWhereStatement: PassthroughWhere<PassthroughColumns>) {
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
  public joinLoad<
    I extends JoinLoadBuilder<DreamInstance>,
    DB extends DreamInstance['DB'],
    TableName extends DreamInstance['table'],
    Schema extends DreamInstance['schema'],
    const Arr extends readonly unknown[],
  >(this: I, ...args: [...Arr, VariadicLoadArgs<DB, Schema, TableName, Arr>]) {
    this.query = this.query.joinLoad(...(args as any))
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

    return await this.query.firstOrFail()
  }
}
