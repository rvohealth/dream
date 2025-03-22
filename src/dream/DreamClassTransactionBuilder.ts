import { SelectArg, SelectExpression, Updateable } from 'kysely'
import Dream from '../Dream.js'
import { type PassthroughOnClause, type WhereStatement } from '../types/associations/shared.js'
import { type AssociationTableNames } from '../types/db.js'
import {
  type DefaultScopeName,
  type DreamColumnNames,
  type OrderDir,
  type PassthroughColumnNames,
  type PluckEachArgs,
  type PrimaryKeyForFind,
  type TableColumnNames,
  type UpdateableProperties,
} from '../types/dream.js'
import {
  type BaseModelColumnTypes,
  type FindEachOpts,
  type QueryWithJoinedAssociationsType,
  type QueryWithJoinedAssociationsTypeAndNoPreload,
} from '../types/query.js'
import {
  type JoinedAssociation,
  type JoinedAssociationsTypeFromAssociations,
  type VariadicJoinsArgs,
  type VariadicLeftJoinLoadArgs,
  type VariadicLoadArgs,
} from '../types/variadic.js'
import DreamTransaction from './DreamTransaction.js'
import saveDream from './internal/saveDream.js'
import Query from './Query.js'

export default class DreamClassTransactionBuilder<DreamInstance extends Dream> {
  /**
   * Constructs a new DreamClassTransactionBuilder.
   *
   * @param dreamInstance - The Dream instance to build the transaction for
   * @param txn - The DreamTransaction instance
   */
  constructor(
    public dreamInstance: DreamInstance,
    public dreamTransaction: DreamTransaction<Dream>
  ) {}

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
   * })
   * ```
   *
   * @param options.columns - Columns to select
   * @returns An array of dreams
   */
  public async all<I extends DreamClassTransactionBuilder<DreamInstance>>(
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
   * @returns The number of records corresponding to this model
   */
  public async count<I extends DreamClassTransactionBuilder<DreamInstance>>(this: I): Promise<number> {
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
  public limit<I extends DreamClassTransactionBuilder<DreamInstance>>(
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
   *   await User.txn(txn).order('id').limit(2).all()
   *   // [User{id: 3}, User{id: 4}]
   * })
   * ```
   *
   * @param offset - The number of records to offset the query by
   * @returns A Query for this model with the offset clause applied
   */
  public offset<I extends DreamClassTransactionBuilder<DreamInstance>>(
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
    I extends DreamClassTransactionBuilder<DreamInstance>,
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
    I extends DreamClassTransactionBuilder<DreamInstance>,
    T extends DreamColumnNames<DreamInstance>,
  >(this: I, columnName: T) {
    return this.queryInstance().min(columnName)
  }

  /**
   * Persists a new record, setting the provided attributes
   *
   * ```ts
   * await ApplicationModel.transaction(async txn => {
   *   const user = await User.txn(txn).create({ email: 'how@yadoin' })
   *   await Post.txn(txn).create({ body: 'howdy', user })
   * })
   * ```
   *
   * @param attributes - Attributes or belongs to associations you wish to set on this model before persisting
   * @returns A newly persisted dream instance
   */
  public async create<I extends DreamClassTransactionBuilder<DreamInstance>>(
    this: I,
    attributes?: UpdateableProperties<DreamInstance>
  ): Promise<DreamInstance> {
    const dream = (this.dreamInstance.constructor as typeof Dream).new(attributes) as DreamInstance
    return saveDream<DreamInstance>(dream, this.dreamTransaction)
  }

  /**
   * Finds a record for the corresponding model with the
   * specified primary key. If not found, null is returned.
   *
   * ```ts
   * await ApplicationModel.transaction(async txn => {
   *   await User.txn(txn).find(123)
   *   // User{id: 123}
   * })
   * ```
   *
   * @param primaryKey - The primary key of the record to look up
   * @returns Either the found record, or else null
   */
  public async find<I extends DreamClassTransactionBuilder<DreamInstance>>(
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
   *   await User.query().txn(txn).findOrFail(123)
   * })
   * // User{id: 123}
   * ```
   *
   * @param primaryKey - The primary key of the record to look up
   * @returns The found record
   */
  public async findOrFail<I extends DreamClassTransactionBuilder<DreamInstance>>(
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
  public async findBy<I extends DreamClassTransactionBuilder<DreamInstance>, DB extends DreamInstance['DB']>(
    this: I,
    attributes: Updateable<DB[DreamInstance['table']]>
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
  public async findOrFailBy<I extends DreamClassTransactionBuilder<DreamInstance>>(
    this: I,
    whereStatement: WhereStatement<DreamInstance['DB'], DreamInstance['schema'], DreamInstance['table']>
  ): Promise<DreamInstance> {
    return await this.queryInstance().findOrFailBy(whereStatement)
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
  public async findEach<I extends DreamClassTransactionBuilder<DreamInstance>>(
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
  public async first<I extends DreamClassTransactionBuilder<DreamInstance>>(
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
  public async firstOrFail<I extends DreamClassTransactionBuilder<DreamInstance>>(
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
  public async exists<I extends DreamClassTransactionBuilder<DreamInstance>>(this: I): Promise<boolean> {
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
    I extends DreamClassTransactionBuilder<DreamInstance>,
    DB extends DreamInstance['DB'],
    TableName extends DreamInstance['table'],
    Schema extends DreamInstance['schema'],
    const Arr extends readonly unknown[],
    const LastArg extends VariadicLeftJoinLoadArgs<DB, Schema, TableName, Arr>,
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
    I extends DreamClassTransactionBuilder<DreamInstance>,
    DB extends DreamInstance['DB'],
    TableName extends DreamInstance['table'],
    Schema extends DreamInstance['schema'],
    const Arr extends readonly unknown[],
  >(this: I, ...args: [...Arr, VariadicLoadArgs<DB, Schema, TableName, Arr>]) {
    return this.queryInstance().preload(...(args as any))
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
    I extends DreamClassTransactionBuilder<DreamInstance>,
    DB extends DreamInstance['DB'],
    TableName extends DreamInstance['table'],
    Schema extends DreamInstance['schema'],
    const Arr extends readonly unknown[],
    const LastArg extends VariadicJoinsArgs<DB, Schema, TableName, Arr>,
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
    I extends DreamClassTransactionBuilder<DreamInstance>,
    DB extends DreamInstance['DB'],
    TableName extends DreamInstance['table'],
    Schema extends DreamInstance['schema'],
    const Arr extends readonly unknown[],
    const LastArg extends VariadicJoinsArgs<DB, Schema, TableName, Arr>,
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
  public queryInstance<I extends DreamClassTransactionBuilder<DreamInstance>>(this: I): Query<DreamInstance> {
    return new Query<DreamInstance>(this.dreamInstance).txn(this.dreamTransaction)
  }

  /**
   * Returns a query for this model which disregards default scopes
   *
   * @returns A query for this model which disregards default scopes
   */
  public removeAllDefaultScopes<I extends DreamClassTransactionBuilder<DreamInstance>>(
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
  public removeDefaultScope<I extends DreamClassTransactionBuilder<DreamInstance>>(
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
  public async last<I extends DreamClassTransactionBuilder<DreamInstance>>(
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
  public async lastOrFail<I extends DreamClassTransactionBuilder<DreamInstance>>(
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
    I extends DreamClassTransactionBuilder<DreamInstance>,
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
  public order<I extends DreamClassTransactionBuilder<DreamInstance>>(
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
    I extends DreamClassTransactionBuilder<DreamInstance>,
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
    I extends DreamClassTransactionBuilder<DreamInstance>,
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
   *   @Deco.HasMany('LocalizedText')
   *   public localizedTexts: LocalizedText[]
   *
   *   @Deco.HasOne('LocalizedText', {
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
    I extends DreamClassTransactionBuilder<DreamInstance>,
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
    I extends DreamClassTransactionBuilder<DreamInstance>,
    DB extends DreamInstance['DB'],
    Schema extends DreamInstance['schema'],
    TableName extends AssociationTableNames<DB, Schema> & keyof DB = I['dreamInstance']['table'] & keyof DB,
  >(this: I, whereStatement: WhereStatement<DB, Schema, TableName>): Query<DreamInstance> {
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
    I extends DreamClassTransactionBuilder<DreamInstance>,
    DB extends DreamInstance['DB'],
    Schema extends DreamInstance['schema'],
    TableName extends AssociationTableNames<DB, Schema> & keyof DB = I['dreamInstance']['table'] & keyof DB,
  >(this: I, whereStatements: WhereStatement<DB, Schema, TableName>[]): Query<DreamInstance> {
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
    I extends DreamClassTransactionBuilder<DreamInstance>,
    DB extends DreamInstance['DB'],
    Schema extends DreamInstance['schema'],
    TableName extends AssociationTableNames<DB, Schema> & keyof DB = I['dreamInstance']['table'] & keyof DB,
  >(this: I, whereStatement: WhereStatement<DB, Schema, TableName>): Query<DreamInstance> {
    return this.queryInstance().whereNot(whereStatement as any)
  }
}
