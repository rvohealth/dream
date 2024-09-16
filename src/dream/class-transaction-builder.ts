import { SelectArg, SelectExpression, Updateable } from 'kysely'
import { AssociationTableNames } from '../db/reflections'
import { PassthroughWhere, WhereStatement } from '../decorators/associations/shared'
import Dream from '../dream'
import saveDream from './internal/saveDream'
import Query, { FindEachOpts } from './query'
import DreamTransaction from './transaction'
import {
  DefaultScopeName,
  DreamColumnNames,
  OrderDir,
  PassthroughColumnNames,
  UpdateableProperties,
  VariadicJoinsArgs,
  VariadicLoadArgs,
} from './types'

export default class DreamClassTransactionBuilder<DreamInstance extends Dream> {
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
   * @returns an array of dreams
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
   * @param columnName - a column name on the model
   * @returns the max value of the specified column for this model's records
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
   *
   * ```ts
   * await ApplicationModel.transaction(async txn => {
   *   await User.txn(txn).min('id')
   *   // 1
   * })
   * ```
   *
   * @param columnName - a column name on the model
   * @returns the min value of the specified column for this model's records
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
   * @param attributes - attributes or belongs to associations you wish to set on this model before persisting
   * @returns A newly persisted dream instance
   */
  public async create<I extends DreamClassTransactionBuilder<DreamInstance>>(
    this: I,
    opts?: UpdateableProperties<DreamInstance>
  ): Promise<DreamInstance> {
    const dream = (this.dreamInstance.constructor as typeof Dream).new(opts) as DreamInstance
    return saveDream<DreamInstance>(dream, this.dreamTransaction)
  }

  /**
   * Finds a record for the corresponding model with the
   * specified primary key. If not found, null
   * is returned
   *
   * ```ts
   * await ApplicationModel.transaction(async txn => {
   *   await User.txn(txn).find(123)
   *   // User{id: 123}
   * })
   * ```
   *
   * @param primaryKey - The primaryKey of the record to look up
   * @returns Either the found record, or else null
   */
  public async find<
    I extends DreamClassTransactionBuilder<DreamInstance>,
    Schema extends DreamInstance['schema'],
    SchemaIdType = Schema[DreamInstance['table']]['columns'][DreamInstance['primaryKey']]['coercedType'],
  >(this: I, id: SchemaIdType): Promise<DreamInstance | null> {
    return await this.queryInstance()
      .where({ [this.dreamInstance.primaryKey]: id } as any)
      .first()
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
   * @param primaryKey - The primaryKey of the record to look up
   * @returns The found record
   */
  public async findOrFail<
    I extends DreamClassTransactionBuilder<DreamInstance>,
    Schema extends DreamInstance['schema'],
    SchemaIdType = Schema[DreamInstance['table']]['columns'][DreamInstance['primaryKey']]['coercedType'],
  >(this: I, primaryKey: SchemaIdType): Promise<DreamInstance> {
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
   * @param whereStatement - The where statement used to locate the record
   * @returns Either the first model found matching the whereStatement, or else null
   */
  public async findBy<I extends DreamClassTransactionBuilder<DreamInstance>, DB extends DreamInstance['DB']>(
    this: I,
    attributes: Updateable<DB[DreamInstance['table']]>
  ): Promise<DreamInstance | null> {
    return await this.queryInstance()
      .where(attributes as any)
      .first()
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
   * and then calls the provided callback
   * for each found record. Once all records
   * have been passed for a given batch, the next set of
   * records will be fetched and passed to your callback, until all
   * records matching the corresponding model have been fetched.
   *
   * ```ts
   * await ApplicationModel.transaction(async txn => {
   *   await User.findEach(user => {
   *     console.log(user)
   *   })
   * })
   * // User{email: 'hello@world'}
   * // User{email: 'goodbye@world'}
   * ```
   *
   * @param cb - The callback to call for each found record
   * @param opts.batchSize - the batch size you wish to collect records in. If not provided, it will default to 1000
   * @returns void
   */
  public async findEach<I extends DreamClassTransactionBuilder<DreamInstance>>(
    this: I,
    cb: (instance: DreamInstance) => void | Promise<void>,
    opts?: FindEachOpts
  ): Promise<void> {
    await this.queryInstance().findEach(cb, opts)
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
   * model class
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
   * Applies include statement to a Query scoped to this model.
   * Upon instantiating records of this model type,
   * specified associations will be included.
   *
   * Preloading/loading is necessary prior to accessing associations
   * on a Dream instance.
   *
   * Include is useful for avoiding the N+1 query problem in a single query
   *
   * ```ts
   * await ApplicationModel.transaction(async txn => {
   *   const user = await User.txn(txn).include('posts', 'comments', { visibilty: 'public' }, 'replies').first()
   *   console.log(user.posts[0].comments[0].replies)
   *   // [Reply{id: 1}, Reply{id: 2}]
   * })
   * ```
   *
   * @param args - A chain of associaition names and where clauses
   * @returns A query for this model with the include statement applied
   */
  public joinLoad<
    I extends DreamClassTransactionBuilder<DreamInstance>,
    DB extends DreamInstance['DB'],
    TableName extends DreamInstance['table'],
    Schema extends DreamInstance['schema'],
    const Arr extends readonly unknown[],
  >(this: I, ...args: [...Arr, VariadicLoadArgs<DB, Schema, TableName, Arr>]) {
    return this.queryInstance().preloadJoin(...(args as any))
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
   * @param args - A chain of associaition names and where clauses
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
   * joins statement attached
   *
   * ```ts
   * await ApplicationModel.transaction(async txn => {
   *   await User.txn(txn).innerJoin('posts').first()
   * })
   * ```
   *
   * @param args - A chain of associaition names and where clauses
   * @returns A Query for this model with the joins clause applied
   */
  public innerJoin<
    I extends DreamClassTransactionBuilder<DreamInstance>,
    DB extends DreamInstance['DB'],
    TableName extends DreamInstance['table'],
    Schema extends DreamInstance['schema'],
    const Arr extends readonly unknown[],
  >(this: I, ...args: [...Arr, VariadicJoinsArgs<DB, Schema, TableName, Arr>]) {
    return this.queryInstance().innerJoin(...(args as any))
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
   * Plucks the provided fields from the corresponding model
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
   * @param fields - The column or array of columns to pluck
   * @returns An array of pluck results
   */
  public async pluck<
    I extends DreamClassTransactionBuilder<DreamInstance>,
    TableName extends DreamInstance['table'],
    ColumnType extends DreamColumnNames<DreamInstance>,
  >(this: I, ...fields: (ColumnType | `${TableName}.${ColumnType}`)[]) {
    return await this.queryInstance().pluck(...(fields as any[]))
  }

  /**
   * Plucks the specified fields from the given dream class table
   * in batches, passing each found columns into the
   * provided callback function
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
   * @param fields - a list of fields to pluck, followed by a callback function to call for each set of found fields
   * @returns void
   */
  public async pluckEach<
    I extends DreamClassTransactionBuilder<DreamInstance>,
    TableName extends DreamInstance['table'],
    ColumnType extends DreamColumnNames<DreamInstance>,
    CB extends (plucked: any) => void | Promise<void>,
  >(this: I, ...fields: (ColumnType | `${TableName}.${ColumnType}` | CB | FindEachOpts)[]): Promise<void> {
    await this.queryInstance().pluckEach(...fields)
  }

  /**
   * Sends data through for use as passthrough data
   * for the associations that require it.
   *
   * ```ts
   * class Post {
   *   @Post.HasMany('LocalizedText')
   *   public localizedTexts: LocalizedText[]
   *
   *   @Post.HasOne('LocalizedText', {
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
  >(this: I, passthroughWhereStatement: PassthroughWhere<PassthroughColumns>): Query<DreamInstance> {
    return this.queryInstance().passthrough(passthroughWhereStatement as any)
  }

  /**
   * Applies a where statement to a new Query instance
   * scoped to this model
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
  >(this: I, attributes: WhereStatement<DB, Schema, TableName>): Query<DreamInstance> {
    return this.queryInstance().where(attributes as any)
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
   * @param whereStatements - a list of where statements to `OR` together
   * @returns A Query for this model with the whereAny clause applied
   */
  public whereAny<
    I extends DreamClassTransactionBuilder<DreamInstance>,
    DB extends DreamInstance['DB'],
    Schema extends DreamInstance['schema'],
    TableName extends AssociationTableNames<DB, Schema> & keyof DB = I['dreamInstance']['table'] & keyof DB,
  >(this: I, attributes: WhereStatement<DB, Schema, TableName>[]): Query<DreamInstance> {
    return this.queryInstance().whereAny(attributes as any)
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
  >(this: I, attributes: WhereStatement<DB, Schema, TableName>): Query<DreamInstance> {
    return this.queryInstance().whereNot(attributes as any)
  }
}
