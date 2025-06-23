import Dream from '../Dream.js'
import { PassthroughOnClause } from '../types/associations/shared.js'
import { DreamSerializerKey, PassthroughColumnNames } from '../types/dream.js'
import { LoadForModifierFn, QueryWithJoinedAssociationsTypeAndNoLeftJoinPreload } from '../types/query.js'
import { VariadicLoadArgs } from '../types/variadic.js'
import DreamTransaction from './DreamTransaction.js'
import Query from './Query.js'

export default class LoadBuilder<DreamInstance extends Dream> {
  private dream: Dream
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
  constructor(
    dream: Dream,
    private dreamTransaction?: DreamTransaction<any> | null
  ) {
    this.dream = dream['clone']()

    // Load queries start from the table corresponding to an instance
    // of a Dream. However, the Dream may have default scopes that would
    // preclude finding that instance, so the Query that forms the base of
    // a load must be unscoped, but that unscoping should not carry through
    // to other associations (thus the use of `removeAllDefaultScopesExceptOnAssociations`
    // instead of `removeAllDefaultScopes`).
    this.query = (this.dream as any).query()['removeAllDefaultScopesExceptOnAssociations']()
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
   * Recursively loads all Dream associations referenced by `rendersOne` and `rendersMany`
   * in a DreamSerializer. This traverses the entire content tree of serializers to automatically
   * load all necessary associations, eliminating N+1 query problems and removing the need to
   * manually remember which associations to preload for serialization.
   *
   * This method decouples data loading code from data rendering code by having the serializer
   * (rendering code) inform the query (loading code) about which associations are needed.
   * As serializers evolve over time - adding new `rendersOne` and `rendersMany` calls or
   * modifying existing ones - the loading code automatically adapts without requiring
   * corresponding modifications to preload statements.
   *
   * This method analyzes the serializer (specified by `serializerKey` or 'default') and
   * automatically preloads all associations that will be needed during serialization.
   *
   * ```ts
   * // Instead of manually specifying all associations:
   * await User.preload('posts', 'comments', 'replies').all()
   *
   * // Automatically preload everything needed for serialization:
   * await user.loadFor('summary').execute()
   *
   * // Add where conditions to specific associations during preloading:
   * await user.loadFor('detailed', (associationName, dreamClass) => {
   *   if (dreamClass.typeof(Post) && associationName === 'comments') {
   *     return { and: { published: true } }
   *   }
   * })
   *    .execute()
   *
   * // Skip preloading specific associations to handle them manually:
   * await user
   *   .loadFor('summary', (associationName, dreamClass) => {
   *     if (dreamClass.typeof(User) && associationName === 'posts') {
   *       return 'omit' // Handle posts preloading separately with custom logic
   *     }
   *   })
   *     .load('posts', { and: { featured: true } }) // Custom preloading
   *     .execute()
   * ```
   *
   * @param serializerKey - The serializer key to use for determining which associations to preload.
   * @param modifierFn - Optional callback function to modify or omit specific associations during preloading. Called for each association with the Dream class and association name. Return an object with `and`, `andAny`, or `andNot` properties to add where conditions, return 'omit' to skip preloading that association (useful when you want to handle it manually), or return undefined to use default preloading
   * @returns A Query with all serialization associations preloaded
   */
  public loadFor<
    I extends LoadBuilder<DreamInstance>,
    SerializerKey extends DreamSerializerKey<DreamInstance>,
  >(this: I, serializerKey: SerializerKey, modifierFn?: LoadForModifierFn) {
    this.query = this.query.preloadFor(serializerKey, modifierFn)
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

    await this.query.dbDriverInstance()['hydratePreload'](this.dream)
    return this.dream as DreamInstance
  }
}
