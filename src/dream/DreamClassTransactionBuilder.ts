import { SelectArg, SelectExpression } from 'kysely'
import Dream from '../Dream.js'
import { PassthroughOnClause, WhereStatement } from '../types/associations/shared.js'
import { AssociationTableNames } from '../types/db.js'
import {
  CreateOrFindByExtraOpts,
  DefaultScopeName,
  DreamColumnNames,
  DreamSerializerKey,
  OrderDir,
  PassthroughColumnNames,
  PluckEachArgs,
  PrimaryKeyForFind,
  TableColumnNames,
  UpdateableProperties,
  UpdateablePropertiesForClass,
  UpdateOrCreateByExtraOpts,
} from '../types/dream.js'
import {
  BaseModelColumnTypes,
  FindEachOpts,
  LoadForModifierFn,
  QueryWithJoinedAssociationsType,
  QueryWithJoinedAssociationsTypeAndNoPreload,
} from '../types/query.js'
import {
  JoinedAssociation,
  JoinedAssociationsTypeFromAssociations,
  VariadicJoinsArgs,
  VariadicLeftJoinLoadArgs,
  VariadicLoadArgs,
} from '../types/variadic.js'
import DreamTransaction from './DreamTransaction.js'
import findOrCreateBy from './internal/findOrCreateBy.js'
import saveDream from './internal/saveDream.js'
import updateOrCreateBy from './internal/updateOrCreateBy.js'
import Query from './Query.js'

export default class DreamClassTransactionBuilder<
  DreamClass extends typeof Dream,
  DreamInstance extends Dream,
> {
  public dreamInstance: DreamInstance

  /**
   * Constructs a new DreamClassTransactionBuilder.
   *
   * @param dreamInstance - The Dream instance to build the transaction for
   * @param txn - The DreamTransaction instance
   */
  constructor(
    private dreamClass: DreamClass,
    private dreamTransaction: DreamTransaction<Dream> | null
  ) {
    this.dreamInstance = dreamClass.prototype as DreamInstance
  }

  /**
   * Retrieves an array containing all records corresponding to
   * this model. Be careful using this, since it will attempt to
   * pull every record into memory at once. For a large number
   * of records, consider using `.findEach`, which will pull
   * the records in batches.
   *
   * ```ts
   * await ApplicationModel.transaction(async txn => {
   *   await User.txn(txn).all()
   *   // [User{id: 1}, User{id: 2}...]
   *
   *   // only load specific columns (always includes primary key)
   *   await User.txn(txn).all({ columns: ['name'] })
   *   // Users will have both 'id' and 'name' properties
   * })
   * ```
   *
   * @param options - Query options
   * @param options.columns - Array of column names to select. The primary key is always included automatically. For STI models, the type field is also automatically included.
   * @returns an array of dreams
   */
  public async all<I extends DreamClassTransactionBuilder<DreamClass, DreamInstance>>(
    this: I,
    options: {
      columns?: DreamColumnNames<DreamInstance>[]
    } = {}
  ): Promise<DreamInstance[]> {
    return this.queryInstance().all(options)
  }

  /**
   * Retrieves the number of records corresponding
   * to this model.
   *
   * ```ts
   * await ApplicationModel.transaction(async txn => {
   *   await User.txn(txn).count()
   *   // 42
   * })
   * ```
   *
   * @returns The number of records corresponding to this model
   */
  public async count<I extends DreamClassTransactionBuilder<DreamClass, DreamInstance>>(
    this: I
  ): Promise<number> {
    return this.queryInstance().count()
  }

  /**
   * Returns a new Query instance, specifying a limit
   *
   * ```ts
   * await ApplicationModel.transaction(async txn => {
   *   await User.txn(txn).limit(2).all()
   *   // [User{}, User{}]
   * })
   * ```
   *
   * @param limit - The number of records to limit the query to
   * @returns A Query for this model with the limit clause applied
   */
  public limit<I extends DreamClassTransactionBuilder<DreamClass, DreamInstance>>(
    this: I,
    limit: number | null
  ): Query<DreamInstance> {
    return this.queryInstance().limit(limit)
  }

  /**
   * Returns a new Query instance, specifying an offset
   *
   * ```ts
   * await ApplicationModel.transaction(async txn => {
   *   await User.txn(txn).order('id').offset(2).limit(2).all()
   *   // [User{id: 3}, User{id: 4}]
   * })
   * ```
   *
   * @param offset - The number of records to offset the query by
   * @returns A Query for this model with the offset clause applied
   */
  public offset<I extends DreamClassTransactionBuilder<DreamClass, DreamInstance>>(
    this: I,
    offset: number | null
  ): Query<DreamInstance> {
    return this.queryInstance().offset(offset)
  }

  /**
   * Retrieves the max value of the specified column
   * for this model's records.
   *
   * ```ts
   * await ApplicationModel.transaction(async txn => {
   *   await User.txn(txn).max('id')
   *   // 99
   * })
   * ```
   *
   * @param columnName - A column name on the model
   * @returns The max value of the specified column for this model's records
   */
  public async max<
    I extends DreamClassTransactionBuilder<DreamClass, DreamInstance>,
    T extends DreamColumnNames<DreamInstance>,
  >(this: I, columnName: T) {
    return this.queryInstance().max(columnName)
  }

  /**
   * Retrieves the min value of the specified column
   * for this model's records.
   *
   * ```ts
   * await ApplicationModel.transaction(async txn => {
   *   await User.txn(txn).min('id')
   *   // 1
   * })
   * ```
   *
   * @param columnName - A column name on the model
   * @returns The min value of the specified column for this model's records
   */
  public async min<
    I extends DreamClassTransactionBuilder<DreamClass, DreamInstance>,
    T extends DreamColumnNames<DreamInstance>,
  >(this: I, columnName: T) {
    return this.queryInstance().min(columnName)
  }

  /**
   * Retrieves the sum value of the specified column
   * for this Query
   *
   * ```ts
   * await Game.txn(txn).sum('score')
   * // 1
   * ```
   *
   * @param columnName - a column name on the model
   * @returns the sum of the values of the specified column for this Query
   */
  public async sum<
    I extends DreamClassTransactionBuilder<DreamClass, DreamInstance>,
    T extends DreamColumnNames<DreamInstance>,
  >(this: I, columnName: T) {
    return this.queryInstance().sum(columnName)
  }

  /**
   * Retrieves the average value of the specified column
   * for this Query
   *
   * ```ts
   * await Game.txn(txn).avg('score')
   * // 1
   * ```
   *
   * @param columnName - a column name on the model
   * @returns the average of the values of the specified column for this Query
   */
  public async avg<
    I extends DreamClassTransactionBuilder<DreamClass, DreamInstance>,
    T extends DreamColumnNames<DreamInstance>,
  >(this: I, columnName: T) {
    return this.queryInstance().avg(columnName)
  }

  /**
   * Persists a new record, setting the provided attributes.
   * Automatically sets createdAt and updatedAt timestamps.
   *
   * ```ts
   * await ApplicationModel.transaction(async txn => {
   *   const user = await User.txn(txn).create({ email: 'how@yadoin', password: 'secure123' })
   *   // Creates and saves a User with the given attributes
   *
   *   await Post.txn(txn).create({ body: 'howdy', user })
   *   // Creates a Post with a BelongsTo association to the user
   * })
   * ```
   *
   * @param attributes - attributes or belongs to associations you wish to set on this model before persisting
   * @param __namedParameters - optional parameters
   * @param __namedParameters.skipHooks - if true, will skip applying model hooks. Defaults to false
   * @returns A newly persisted dream instance
   */
  public async create<I extends DreamClassTransactionBuilder<DreamClass, DreamInstance>>(
    this: I,
    attributes?: UpdateableProperties<DreamInstance>,
    { skipHooks }: { skipHooks?: boolean } = {}
  ): Promise<DreamInstance> {
    const dream = this.dreamClass.new(attributes) as DreamInstance
    return saveDream<DreamInstance>(dream, this.dreamTransaction, skipHooks ? { skipHooks } : undefined)
  }

  /**
   * Finds a record for the corresponding model with the
   * specified primary key. If not found, null is returned.
   *
   * ```ts
   * await ApplicationModel.transaction(async txn => {
   *   await User.txn(txn).find(123)
   *   // User{id: 123}
   *
   *   await User.txn(txn).find(null)
   *   // null
   *
   *   await User.txn(txn).find(undefined)
   *   // null
   * })
   * ```
   *
   * @param primaryKey - The primaryKey of the record to look up.
   * @returns Either the found record, or else null
   */
  public async find<I extends DreamClassTransactionBuilder<DreamClass, DreamInstance>>(
    this: I,
    primaryKey: PrimaryKeyForFind<DreamInstance>
  ): Promise<DreamInstance | null> {
    return await this.queryInstance().find(primaryKey)
  }

  /**
   * Finds a record for the corresponding model with the
   * specified primary key. If not found, an exception is raised.
   *
   * ```ts
   * await ApplicationModel.transaction(async txn => {
   *   await User.txn(txn).findOrFail(123)
   *   // User{id: 123}
   * })
   * ```
   *
   * @param primaryKey - The primaryKey of the record to look up
   * @returns The found record
   */
  public async findOrFail<I extends DreamClassTransactionBuilder<DreamClass, DreamInstance>>(
    this: I,
    primaryKey: PrimaryKeyForFind<DreamInstance>
  ): Promise<DreamInstance> {
    return await this.queryInstance().findOrFail(primaryKey)
  }

  /**
   * Finds the first record—ordered by primary key—matching
   * the corresponding model and the specified where statement.
   * If not found, null is returned.
   *
   * ```ts
   * await ApplicationModel.transaction(async txn => {
   *   await User.txn(txn).findBy({ email: 'how@yadoin' })
   *   // User{email: 'how@yadoin'}
   * })
   * ```
   *
   * @param attributes - The where statement used to locate the record
   * @returns Either the first model found matching the whereStatement, or else null
   */
  public async findBy<I extends DreamClassTransactionBuilder<DreamClass, DreamInstance>>(
    this: I,
    attributes: WhereStatement<
      DreamInstance,
      DreamInstance['DB'],
      DreamInstance['schema'],
      DreamInstance['table']
    >
  ): Promise<DreamInstance | null> {
    return await this.queryInstance().findBy(attributes as any)
  }

  /**
   * Finds the first record—ordered by primary key—matching
   * the corresponding model and the specified where statement.
   * If not found, an exception is raised.
   *
   * ```ts
   * await ApplicationModel.transaction(async txn => {
   *   await User.txn(txn).findOrFailBy({ email: 'how@yadoin' })
   * })
   * // User{email: 'how@yadoin'}
   * ```
   *
   * @param whereStatement - The where statement used to locate the record
   * @returns The first model found matching the whereStatement
   */
  public async findOrFailBy<I extends DreamClassTransactionBuilder<DreamClass, DreamInstance>>(
    this: I,
    whereStatement: WhereStatement<
      DreamInstance,
      DreamInstance['DB'],
      DreamInstance['schema'],
      DreamInstance['table']
    >
  ): Promise<DreamInstance> {
    return await this.queryInstance().findOrFailBy(whereStatement)
  }

  /**
   * Attempt to find the model with the given attributes.
   * If no record is found, then a new record is created.
   *
   * ```ts
   * await ApplicationModel.transaction(async txn => {
   *   const user = await User.txn(txn).findOrCreateBy({ email }, { createWith: params })
   * })
   * ```
   *
   * @param attributes - The base attributes for finding, but also the attributes to use when creating
   * @param extraOpts - Additional options
   * @param extraOpts.createWith - additional attributes to persist when creating, but not used for finding
   * @returns A dream instance
   */
  public async findOrCreateBy<I extends DreamClassTransactionBuilder<DreamClass, DreamInstance>>(
    this: I,
    attributes: UpdateablePropertiesForClass<DreamClass>,
    extraOpts: CreateOrFindByExtraOpts<DreamClass> = {}
  ): Promise<InstanceType<DreamClass>> {
    return await findOrCreateBy(this.dreamClass, this.dreamTransaction, attributes, extraOpts)
  }

  /**
   * Attempt to update the model with the given attributes.
   * If no record is found, then a new record is created.
   * All lifecycle hooks are run for whichever action is taken.
   *
   * ```ts
   * await ApplicationModel.transaction(async txn => {
   *   await User.txn(txn).updateOrCreateBy({ email }, { with: { name: 'Alice' })
   * })
   * ```
   *
   * @param attributes - The base attributes for finding, but also the attributes to use when creating
   * @param extraOpts.with - additional attributes to persist when updating and creating, but not used for finding
   * @param extraOpts.skipHooks - if true, will skip applying model hooks. Defaults to false
   * @returns A dream instance
   */
  public async updateOrCreateBy<I extends DreamClassTransactionBuilder<DreamClass, DreamInstance>>(
    this: I,
    attributes: UpdateablePropertiesForClass<DreamClass>,
    extraOpts: UpdateOrCreateByExtraOpts<DreamClass> = {}
  ): Promise<InstanceType<DreamClass>> {
    return await updateOrCreateBy(this.dreamClass, this.dreamTransaction, attributes, extraOpts)
  }

  /**
   * Finds all records for the corresponding model in batches,
   * and then calls the provided callback for each found record.
   * Once all records have been passed for a given batch, the next set of
   * records will be fetched and passed to your callback, until all
   * records matching the corresponding model have been fetched.
   *
   * ```ts
   * await ApplicationModel.transaction(async txn => {
   *   await User.txn(txn).findEach(user => {
   *     console.log(user)
   *   })
   * })
   * // User{email: 'hello@world'}
   * // User{email: 'goodbye@world'}
   * ```
   *
   * @param cb - The callback to call for each found record
   * @param options.batchSize - The batch size you wish to collect records in. If not provided, it will default to 1000
   * @returns void
   */
  public async findEach<I extends DreamClassTransactionBuilder<DreamClass, DreamInstance>>(
    this: I,
    cb: (instance: DreamInstance) => void | Promise<void>,
    options?: FindEachOpts
  ): Promise<void> {
    await this.queryInstance().findEach(cb, options)
  }

  /**
   * Returns the first record corresponding to the
   * model, ordered by primary key.
   *
   * ```ts
   * await ApplicationModel.transaction(async txn => {
   *   await User.txn(txn).first()
   *   // User{id: 1}
   * })
   * ```
   *
   * @returns First record, or null if no record exists
   */
  public async first<I extends DreamClassTransactionBuilder<DreamClass, DreamInstance>>(
    this: I
  ): Promise<DreamInstance | null> {
    return this.queryInstance().first()
  }

  /**
   * Returns the first record corresponding to the
   * model, ordered by primary key. If no record
   * is found, an exception is raised.
   *
   * ```ts
   * await ApplicationModel.transaction(async txn => {
   *   await User.txn(txn).firstOrFail()
   *   // User{id: 1}
   * })
   * ```
   *
   * @returns First record
   */
  public async firstOrFail<I extends DreamClassTransactionBuilder<DreamClass, DreamInstance>>(
    this: I
  ): Promise<DreamInstance> {
    return this.queryInstance().firstOrFail()
  }

  /**
   * Returns true if a record exists for the given
   * model class.
   *
   * ```ts
   * await ApplicationModel.transaction(async txn => {
   *   await User.txn(txn).exists()
   *   // false
   *
   *   await User.txn(txn).create({ email: 'how@yadoin' })
   *
   *   await User.txn(txn).exists()
   *   // true
   * })
   * ```
   *
   * @returns boolean
   */
  public async exists<I extends DreamClassTransactionBuilder<DreamClass, DreamInstance>>(
    this: I
  ): Promise<boolean> {
    return this.queryInstance().exists()
  }

  /**
   * Load each specified association using a single SQL query.
   * See {@link #preload} for preloading in separate queries.
   *
   * Note: since leftJoinPreload loads via single query, it has
   * some downsides and that may be avoided using {@link #preload}:
   * 1. `limit` and `offset` will be automatically removed
   * 2. `through` associations will bring additional namespaces into the query that can conflict with through associations from other associations, creating an invalid query
   * 3. each nested association will result in an additional record which duplicates data from the outer record. E.g., given `.leftJoinPreload('a', 'b', 'c')`, if each `a` has 10 `b` and each `b` has 10 `c`, then for one `a`, 100 records will be returned, each of which has all of the columns of `a`. `.preload('a', 'b', 'c')` would perform three separate SQL queries, but the data for a single `a` would only be returned once.
   * 4. the individual query becomes more complex the more associations are included
   * 5. associations loading associations loading associations could result in exponential amounts of data; in those cases, `.preload(...).findEach(...)` avoids instantiating massive amounts of data at once
   *
   * ```ts
   * const user = await User.txn(txn).leftJoinPreload('posts', 'comments', { visibilty: 'public' }, 'replies').first()
   * console.log(user.posts[0].comments[0].replies)
   * // [Reply{id: 1}, Reply{id: 2}]
   * ```
   *
   * @param args - A chain of association names and where clauses
   * @returns A query for this model with the include statement applied
   */
  public leftJoinPreload<
    I extends DreamClassTransactionBuilder<DreamClass, DreamInstance>,
    DB extends DreamInstance['DB'],
    TableName extends DreamInstance['table'],
    Schema extends DreamInstance['schema'],
    const Arr extends readonly unknown[],
    const LastArg extends VariadicLeftJoinLoadArgs<DreamInstance, DB, Schema, TableName, Arr>,
    const JoinedAssociationsCandidate = JoinedAssociationsTypeFromAssociations<
      DB,
      Schema,
      TableName,
      [...Arr, LastArg]
    >,
    const JoinedAssociations extends
      readonly JoinedAssociation[] = JoinedAssociationsCandidate extends readonly JoinedAssociation[]
      ? JoinedAssociationsCandidate
      : never,
    RetQuery = QueryWithJoinedAssociationsTypeAndNoPreload<Query<DreamInstance>, JoinedAssociations>,
  >(this: I, ...args: [...Arr, LastArg]): RetQuery {
    return this.queryInstance().leftJoinPreload(...(args as any))
  }

  /**
   * Applies preload statement to a Query scoped to this model.
   * Upon instantiating records of this model type,
   * specified associations will be preloaded.
   *
   * Preloading/loading is necessary prior to accessing associations
   * on a Dream instance.
   *
   * Preload is useful for avoiding the N+1 query problem
   *
   * ```ts
   * await ApplicationModel.transaction(async txn => {
   *   const user = await User.txn(txn).preload('posts', 'comments', { visibilty: 'public' }, 'replies').first()
   *   console.log(user.posts[0].comments[0].replies)
   *   // [Reply{id: 1}, Reply{id: 2}]
   * })
   * ```
   *
   * @param args - A chain of association names and where clauses
   * @returns A query for this model with the preload statement applied
   */
  public preload<
    I extends DreamClassTransactionBuilder<DreamClass, DreamInstance>,
    DB extends DreamInstance['DB'],
    TableName extends DreamInstance['table'],
    Schema extends DreamInstance['schema'],
    const Arr extends readonly unknown[],
  >(this: I, ...args: [...Arr, VariadicLoadArgs<DreamInstance, DB, Schema, TableName, Arr>]) {
    return this.queryInstance().preload(...(args as any))
  }

  /**
   * Recursively preloads all Dream associations referenced by `rendersOne` and `rendersMany`
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
   * await ApplicationModel.transaction(async txn => {
   *   // Instead of manually specifying all associations:
   *   await User.txn(txn).preload('posts', 'comments', 'replies').all()
   *
   *   // Automatically preload everything needed for serialization:
   *   await User.txn(txn).preloadFor('summary').all()
   *
   *   // Add where conditions to specific associations during preloading:
   *   await User.txn(txn).preloadFor('detailed', (associationName, dreamClass) => {
   *     if (dreamClass.typeof(Post) && associationName === 'comments') {
   *       return { and: { published: true } }
   *     }
   *   }).all()
   *
   *   // Skip preloading specific associations to handle them manually:
   *   await User.txn(txn).preloadFor('summary', (associationName, dreamClass) => {
   *     if (dreamClass.typeof(User) && associationName === 'posts') {
   *       return 'omit' // Handle posts preloading separately with custom logic
   *     }
   *   })
   *   .preload('posts', { and: { featured: true } }) // Custom preloading
   *   .all()
   * })
   * ```
   *
   * @param serializerKey - The serializer key to use for determining which associations to preload.
   * @param modifierFn - Optional callback function to modify or omit specific associations during preloading. Called for each association with the Dream class and association name. Return an object with `and`, `andAny`, or `andNot` properties to add where conditions, return 'omit' to skip preloading that association (useful when you want to handle it manually), or return undefined to use default preloading
   * @returns A Query with all serialization associations preloaded
   */
  public preloadFor<
    T extends DreamClassTransactionBuilder<DreamClass, DreamInstance>,
    SerializerKey extends DreamSerializerKey<DreamInstance>,
  >(this: T, serializerKey: SerializerKey, modifierFn?: LoadForModifierFn) {
    return this.queryInstance().preloadFor(serializerKey, modifierFn)
  }

  /**
   * Returns a new Query instance with the provided
   * inner join statement attached
   *
   * ```ts
   * await ApplicationModel.transaction(async txn => {
   *   await User.txn(txn).innerJoin('posts').first()
   * })
   * ```
   *
   * @param args - A chain of association names and where clauses
   * @returns A Query for this model with the inner join clause applied
   */
  public innerJoin<
    I extends DreamClassTransactionBuilder<DreamClass, DreamInstance>,
    DB extends DreamInstance['DB'],
    TableName extends DreamInstance['table'],
    Schema extends DreamInstance['schema'],
    const Arr extends readonly unknown[],
    const LastArg extends VariadicJoinsArgs<DreamInstance, DB, Schema, TableName, Arr>,
    const JoinedAssociationsCandidate = JoinedAssociationsTypeFromAssociations<
      DB,
      Schema,
      TableName,
      [...Arr, LastArg]
    >,
    const JoinedAssociations extends
      readonly JoinedAssociation[] = JoinedAssociationsCandidate extends readonly JoinedAssociation[]
      ? JoinedAssociationsCandidate
      : never,
    RetQuery = QueryWithJoinedAssociationsType<Query<DreamInstance>, JoinedAssociations>,
  >(this: I, ...args: [...Arr, LastArg]): RetQuery {
    return this.queryInstance().innerJoin(...(args as any))
  }

  /**
   * Returns a new Query instance with the provided
   * left join statement attached
   *
   * ```ts
   * await ApplicationModel.transaction(async txn => {
   *   await User.txn(txn).leftJoin('posts').first()
   * })
   * ```
   *
   * @param args - A chain of association names and where clauses
   * @returns A Query for this model with the left join clause applied
   */
  public leftJoin<
    I extends DreamClassTransactionBuilder<DreamClass, DreamInstance>,
    DB extends DreamInstance['DB'],
    TableName extends DreamInstance['table'],
    Schema extends DreamInstance['schema'],
    const Arr extends readonly unknown[],
    const LastArg extends VariadicJoinsArgs<DreamInstance, DB, Schema, TableName, Arr>,
    const JoinedAssociationsCandidate = JoinedAssociationsTypeFromAssociations<
      DB,
      Schema,
      TableName,
      [...Arr, LastArg]
    >,
    const JoinedAssociations extends
      readonly JoinedAssociation[] = JoinedAssociationsCandidate extends readonly JoinedAssociation[]
      ? JoinedAssociationsCandidate
      : never,
    RetQuery = QueryWithJoinedAssociationsType<Query<DreamInstance>, JoinedAssociations>,
  >(this: I, ...args: [...Arr, LastArg]): RetQuery {
    return this.queryInstance().leftJoin(...(args as any))
  }

  /**
   * Returns a new instance of Query scoped to the given
   * model class
   *
   * ```ts
   * await ApplicationModel.transaction(async txn => {
   *   const query = User.txn(txn).queryInstance()
   * })
   * ```
   *
   * @returns A new Query instance
   */
  public queryInstance<I extends DreamClassTransactionBuilder<DreamClass, DreamInstance>>(
    this: I
  ): Query<DreamInstance> {
    return new Query<DreamInstance>(this.dreamInstance).txn(this.dreamTransaction)
  }

  /**
   * Returns a query for this model which disregards default scopes
   *
   * @returns A query for this model which disregards default scopes
   */
  public removeAllDefaultScopes<I extends DreamClassTransactionBuilder<DreamClass, DreamInstance>>(
    this: I
  ): Query<DreamInstance> {
    return this.queryInstance().removeAllDefaultScopes()
  }

  /**
   * Prevents a specific default scope from applying when
   * the Query is executed
   *
   * @returns A new Query which will prevent a specific default scope from applying
   */
  public removeDefaultScope<I extends DreamClassTransactionBuilder<DreamClass, DreamInstance>>(
    this: I,
    scopeName: DefaultScopeName<DreamInstance>
  ): Query<DreamInstance> {
    return this.queryInstance().removeDefaultScope(scopeName)
  }

  /**
   * Returns the last record corresponding to the
   * model, ordered by primary key.
   *
   * ```ts
   * await ApplicationModel.transaction(async txn => {
   *   await User.txn(txn).last()
   *   // User{id: 99}
   * })
   * ```
   *
   * @returns Last record, or null if no record exists
   */
  public async last<I extends DreamClassTransactionBuilder<DreamClass, DreamInstance>>(
    this: I
  ): Promise<DreamInstance | null> {
    return this.queryInstance().last()
  }

  /**
   * Returns the last record corresponding to the
   * model, ordered by primary key. If no record
   * is found, an exception is raised.
   *
   * ```ts
   * await ApplicationModel.transaction(async txn => {
   *   await User.txn(txn).lastOrFail()
   *   // User{id: 99}
   * })
   * ```
   *
   * @returns Last record
   */
  public async lastOrFail<I extends DreamClassTransactionBuilder<DreamClass, DreamInstance>>(
    this: I
  ): Promise<DreamInstance> {
    return this.queryInstance().lastOrFail()
  }

  /**
   * Returns a new Kysely SelectQueryBuilder instance to be used
   * in a sub Query
   *
   * ```ts
   * await ApplicationModel.transaction(async txn => {
   *   await User.txn(txn).where({
   *     id: Post.txn(txn).nestedSelect('userId'),
   *   }).all()
   *   // [User{id: 1}, ...]
   * })
   * ```
   *
   * @param selection - the column to use for your nested Query
   * @returns A Kysely SelectQueryBuilder instance
   */
  public nestedSelect<
    I extends DreamClassTransactionBuilder<DreamClass, DreamInstance>,
    DB extends DreamInstance['DB'],
    SE extends SelectExpression<DB, DreamInstance['table']>,
  >(this: I, selection: SelectArg<DB, DreamInstance['table'], SE>) {
    return this.queryInstance().nestedSelect(selection as any)
  }

  /**
   * Returns a new Query instance, attaching the provided
   * order statement
   *
   * ```ts
   * await ApplicationModel.transaction(async txn => {
   *   await User.txn(txn).order('id').all()
   *   // [User{id: 1}, User{id: 2}, ...]
   * })
   * ```
   *
   * ```ts
   * await ApplicationModel.transaction(async txn => {
   *   await User.txn(txn).order({ name: 'asc', id: 'desc' }).all()
   *   // [User{name: 'a', id: 99}, User{name: 'a', id: 97}, User{ name: 'b', id: 98 } ...]
   * })
   * ```
   *
   * @param orderStatement - Either a string or an object specifying order. If a string, the order is implicitly ascending. If the orderStatement is an object, statements will be provided in the order of the keys set in the object
   * @returns A query for this model with the order clause applied
   */
  public order<I extends DreamClassTransactionBuilder<DreamClass, DreamInstance>>(
    this: I,
    arg: DreamColumnNames<DreamInstance> | Partial<Record<DreamColumnNames<DreamInstance>, OrderDir>> | null
  ) {
    return this.queryInstance().order(arg as any)
  }

  /**
   * Plucks the provided fields from the corresponding model.
   *
   * ```ts
   * await ApplicationModel.transaction(async txn => {
   *   await User.txn(txn).pluck('id')
   *   // [1, 3, 2]
   * })
   * ```
   *
   * If more than one column is requested, a multi-dimensional
   * array is returned:
   *
   * ```ts
   * await ApplicationModel.transaction(async txn => {
   *   await User.txn(txn).order('id').pluck('id', 'email')
   *   // [[1, 'a@a.com'], [2, 'b@b.com']]
   * })
   * ```
   *
   * @param columnNames - The column or array of columns to pluck
   * @returns An array of pluck results
   */
  public async pluck<
    I extends DreamClassTransactionBuilder<DreamClass, DreamInstance>,
    ColumnNames extends TableColumnNames<DreamInstance['DB'], DreamInstance['table']>[],
    ReturnValue extends ColumnNames['length'] extends 1
      ? BaseModelColumnTypes<ColumnNames, DreamInstance>[0][]
      : BaseModelColumnTypes<ColumnNames, DreamInstance>[],
  >(this: I, ...columnNames: ColumnNames): Promise<ReturnValue> {
    return (await this.queryInstance().pluck(...(columnNames as any[]))) as ReturnValue
  }

  /**
   * Plucks the specified fields from the given dream class table
   * in batches, passing each found columns into the provided callback function.
   *
   * ```ts
   * await ApplicationModel.transaction(async txn => {
   *   await User.txn(txn).order('id').pluckEach('id', (id) => {
   *     console.log(id)
   *   })
   *   // 1
   *   // 2
   *   // 3
   * })
   * ```
   *
   * @param fields - A list of fields to pluck, followed by a callback function to call for each set of found fields
   * @returns void
   */
  public async pluckEach<
    I extends DreamClassTransactionBuilder<DreamClass, DreamInstance>,
    ColumnName extends keyof UpdateableProperties<DreamInstance>,
    ColumnNames extends ColumnName[],
    CbArgTypes extends BaseModelColumnTypes<ColumnNames, DreamInstance>,
  >(this: I, ...args: PluckEachArgs<ColumnNames, CbArgTypes>) {
    await this.queryInstance().pluckEach(...(args as any))
  }

  /**
   * Sends data through for use as passthrough data
   * for the associations that require it.
   *
   * ```ts
   * class Post {
   *   @deco.HasMany('LocalizedText')
   *   public localizedTexts: LocalizedText[]
   *
   *   @deco.HasOne('LocalizedText', {
   *     where: { locale: DreamConst.passthrough },
   *   })
   *   public currentLocalizedText: LocalizedText
   * }
   *
   * await ApplicationModel.transaction(async txn => {
   *   await User.txn(txn).passthrough({ locale: 'es-ES' })
   *     .preload('posts', 'currentLocalizedText')
   *     .first()
   * })
   * ```
   *
   * @param passthroughWhereStatement - Where statement used for associations that require passthrough data
   * @returns A Query for this model with the passthrough data
   */
  public passthrough<
    I extends DreamClassTransactionBuilder<DreamClass, DreamInstance>,
    PassthroughColumns extends PassthroughColumnNames<DreamInstance>,
  >(this: I, passthroughWhereStatement: PassthroughOnClause<PassthroughColumns>): Query<DreamInstance> {
    return this.queryInstance().passthrough(passthroughWhereStatement as any)
  }

  /**
   * Applies a where statement to a new Query instance
   * scoped to this model.
   *
   * ```ts
   * await ApplicationModel.transaction(async txn => {
   *   await User.txn(txn).where({ email: 'how@yadoin' }).first()
   *   // User{email: 'how@yadoin'}
   * })
   * ```
   *
   * @param whereStatement - Where statement to apply to the Query
   * @returns A Query for this model with the where clause applied
   */
  public where<
    I extends DreamClassTransactionBuilder<DreamClass, DreamInstance>,
    DB extends DreamInstance['DB'],
    Schema extends DreamInstance['schema'],
    TableName extends AssociationTableNames<DB, Schema> & keyof DB = I['dreamInstance']['table'] & keyof DB,
  >(this: I, whereStatement: WhereStatement<DreamInstance, DB, Schema, TableName>): Query<DreamInstance> {
    return this.queryInstance().where(whereStatement as any)
  }

  /**
   * Applies "OR"'d where statements to a Query scoped
   * to this model.
   *
   * ```ts
   * await ApplicationModel.transaction(async txn => {
   *   await User.txn(txn).whereAny([{ email: 'how@yadoin' }, { name: 'fred' }]).first()
   *   // [User{email: 'how@yadoin'}, User{name: 'fred'}, User{name: 'fred'}]
   * })
   * ```
   *
   * @param whereStatements - An array of where statements to `OR` together
   * @returns A Query for this model with the whereAny clause applied
   */
  public whereAny<
    I extends DreamClassTransactionBuilder<DreamClass, DreamInstance>,
    DB extends DreamInstance['DB'],
    Schema extends DreamInstance['schema'],
    TableName extends AssociationTableNames<DB, Schema> & keyof DB = I['dreamInstance']['table'] & keyof DB,
  >(this: I, whereStatements: WhereStatement<DreamInstance, DB, Schema, TableName>[]): Query<DreamInstance> {
    return this.queryInstance().whereAny(whereStatements as any)
  }

  /**
   * Applies a whereNot statement to a new Query instance
   * scoped to this model.
   *
   * ```ts
   * await ApplicationModel.transaction(async txn => {
   *   await User.txn(txn).whereNot({ email: 'how@yadoin' }).first()
   *   // User{email: 'hello@world'}
   * })
   * ```
   *
   * @param whereStatement - A where statement to negate and apply to the Query
   * @returns A Query for this model with the whereNot clause applied
   */
  public whereNot<
    I extends DreamClassTransactionBuilder<DreamClass, DreamInstance>,
    DB extends DreamInstance['DB'],
    Schema extends DreamInstance['schema'],
    TableName extends AssociationTableNames<DB, Schema> & keyof DB = I['dreamInstance']['table'] & keyof DB,
  >(this: I, whereStatement: WhereStatement<DreamInstance, DB, Schema, TableName>): Query<DreamInstance> {
    return this.queryInstance().whereNot(whereStatement as any)
  }
}
