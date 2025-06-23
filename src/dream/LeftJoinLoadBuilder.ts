import Dream from '../Dream.js'
import UnexpectedUndefined from '../errors/UnexpectedUndefined.js'
import { PassthroughOnClause } from '../types/associations/shared.js'
import { DreamSerializerKey, IdType, PassthroughColumnNames } from '../types/dream.js'
import {
  LoadForModifierFn,
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

    // Load queries start from the table corresponding to an instance
    // of a Dream. However, the Dream may have default scopes that would
    // preclude finding that instance, so the Query that forms the base of
    // a load must be unscoped, but that unscoping should not carry through
    // to other associations (thus the use of `removeAllDefaultScopesExceptOnAssociations`
    // instead of `removeAllDefaultScopes`).
    this.query = (this.dream as any).query()['removeAllDefaultScopesExceptOnAssociations']()
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
   * await user.leftJoinLoadFor('summary').execute()
   *
   * // Add where conditions to specific associations during preloading:
   * await user.leftJoinLoadFor('detailed', (associationName, dreamClass) => {
   *   if (dreamClass.typeof(Post) && associationName === 'comments') {
   *     return { and: { published: true } }
   *   }
   * })
   *    .execute()
   *
   * // Skip preloading specific associations to handle them manually:
   * await user
   *   .leftJoinLoadFor('summary', (associationName, dreamClass) => {
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
  public leftJoinLoadFor<
    I extends LeftJoinLoadBuilder<DreamInstance>,
    SerializerKey extends DreamSerializerKey<DreamInstance>,
  >(this: I, serializerKey: SerializerKey, modifierFn?: LoadForModifierFn) {
    this.query = this.query.leftJoinPreloadFor(serializerKey, modifierFn)
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
