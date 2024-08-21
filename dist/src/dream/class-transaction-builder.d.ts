import { SelectArg, SelectExpression, Updateable } from 'kysely';
import { ExtractTableAlias } from 'kysely/dist/cjs/parser/table-parser';
import { AssociationTableNames } from '../db/reflections';
import { PassthroughWhere, WhereStatement } from '../decorators/associations/shared';
import Dream from '../dream';
import Query, { FindEachOpts } from './query';
import DreamTransaction from './transaction';
import { DefaultScopeName, DreamColumnNames, OrderDir, PassthroughColumnNames, UpdateableProperties, VariadicJoinsArgs, VariadicLoadArgs } from './types';
export default class DreamClassTransactionBuilder<DreamInstance extends Dream> {
    dreamInstance: DreamInstance;
    dreamTransaction: DreamTransaction<Dream>;
    constructor(dreamInstance: DreamInstance, dreamTransaction: DreamTransaction<Dream>);
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
    all<I extends DreamClassTransactionBuilder<DreamInstance>>(this: I): Promise<DreamInstance[]>;
    /**
     * Retrieves the number of records corresponding
     * to this model.
     *
     * @returns The number of records corresponding to this model
     */
    count<I extends DreamClassTransactionBuilder<DreamInstance>>(this: I): Promise<number>;
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
    limit<I extends DreamClassTransactionBuilder<DreamInstance>>(this: I, limit: number | null): Query<DreamInstance>;
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
    offset<I extends DreamClassTransactionBuilder<DreamInstance>>(this: I, offset: number | null): Query<DreamInstance>;
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
    max<I extends DreamClassTransactionBuilder<DreamInstance>, T extends DreamColumnNames<DreamInstance>>(this: I, columnName: T): Promise<import("./types").DreamColumn<DreamInstance, T & keyof DreamInstance["schema"][DreamInstance["table"] & keyof DreamInstance["schema"]]["columns" & keyof DreamInstance["schema"][DreamInstance["table"] & keyof DreamInstance["schema"]]]> | null>;
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
    min<I extends DreamClassTransactionBuilder<DreamInstance>, T extends DreamColumnNames<DreamInstance>>(this: I, columnName: T): Promise<import("./types").DreamColumn<DreamInstance, T & keyof DreamInstance["schema"][DreamInstance["table"] & keyof DreamInstance["schema"]]["columns" & keyof DreamInstance["schema"][DreamInstance["table"] & keyof DreamInstance["schema"]]]> | null>;
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
    create<I extends DreamClassTransactionBuilder<DreamInstance>>(this: I, opts?: UpdateableProperties<DreamInstance>): Promise<DreamInstance>;
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
    find<I extends DreamClassTransactionBuilder<DreamInstance>, Schema extends DreamInstance['schema'], SchemaIdType = Schema[DreamInstance['table']]['columns'][DreamInstance['primaryKey']]['coercedType']>(this: I, id: SchemaIdType): Promise<DreamInstance | null>;
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
    findOrFail<I extends DreamClassTransactionBuilder<DreamInstance>, Schema extends DreamInstance['schema'], SchemaIdType = Schema[DreamInstance['table']]['columns'][DreamInstance['primaryKey']]['coercedType']>(this: I, primaryKey: SchemaIdType): Promise<DreamInstance>;
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
    findBy<I extends DreamClassTransactionBuilder<DreamInstance>, DB extends DreamInstance['DB']>(this: I, attributes: Updateable<DB[DreamInstance['table']]>): Promise<DreamInstance | null>;
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
    findOrFailBy<I extends DreamClassTransactionBuilder<DreamInstance>>(this: I, whereStatement: WhereStatement<DreamInstance['DB'], DreamInstance['schema'], DreamInstance['table']>): Promise<DreamInstance>;
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
    findEach<I extends DreamClassTransactionBuilder<DreamInstance>>(this: I, cb: (instance: DreamInstance) => void | Promise<void>, opts?: FindEachOpts): Promise<void>;
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
    first<I extends DreamClassTransactionBuilder<DreamInstance>>(this: I): Promise<DreamInstance | null>;
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
    firstOrFail<I extends DreamClassTransactionBuilder<DreamInstance>>(this: I): Promise<DreamInstance>;
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
    exists<I extends DreamClassTransactionBuilder<DreamInstance>>(this: I): Promise<boolean>;
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
    preload<I extends DreamClassTransactionBuilder<DreamInstance>, DB extends DreamInstance['DB'], TableName extends DreamInstance['table'], Schema extends DreamInstance['schema'], const Arr extends readonly unknown[]>(this: I, ...args: [...Arr, VariadicLoadArgs<DB, Schema, TableName, Arr>]): Query<DreamInstance>;
    /**
     * Returns a new Query instance with the provided
     * joins statement attached
     *
     * ```ts
     * await ApplicationModel.transaction(async txn => {
     *   await User.txn(txn).joins('posts').first()
     * })
     * ```
     *
     * @param args - A chain of associaition names and where clauses
     * @returns A Query for this model with the joins clause applied
     */
    joins<I extends DreamClassTransactionBuilder<DreamInstance>, DB extends DreamInstance['DB'], TableName extends DreamInstance['table'], Schema extends DreamInstance['schema'], const Arr extends readonly unknown[]>(this: I, ...args: [...Arr, VariadicJoinsArgs<DB, Schema, TableName, Arr>]): Query<DreamInstance>;
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
    queryInstance<I extends DreamClassTransactionBuilder<DreamInstance>>(this: I): Query<DreamInstance>;
    /**
     * Returns a query for this model which disregards default scopes
     *
     * @returns A query for this model which disregards default scopes
     */
    removeAllDefaultScopes<I extends DreamClassTransactionBuilder<DreamInstance>>(this: I): Query<DreamInstance>;
    /**
     * Prevents a specific default scope from applying when
     * the Query is executed
     *
     * @returns A new Query which will prevent a specific default scope from applying
     */
    removeDefaultScope<I extends DreamClassTransactionBuilder<DreamInstance>>(this: I, scopeName: DefaultScopeName<DreamInstance>): Query<DreamInstance>;
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
    last<I extends DreamClassTransactionBuilder<DreamInstance>>(this: I): Promise<DreamInstance | null>;
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
    lastOrFail<I extends DreamClassTransactionBuilder<DreamInstance>>(this: I): Promise<DreamInstance>;
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
    nestedSelect<I extends DreamClassTransactionBuilder<DreamInstance>, DB extends DreamInstance['DB'], SE extends SelectExpression<DB, ExtractTableAlias<DB, DreamInstance['table']>>>(this: I, selection: SelectArg<DB, ExtractTableAlias<DB, DreamInstance['table']>, SE>): import("kysely").SelectQueryBuilder<any, any, any>;
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
    order<I extends DreamClassTransactionBuilder<DreamInstance>>(this: I, arg: DreamColumnNames<DreamInstance> | Partial<Record<DreamColumnNames<DreamInstance>, OrderDir>> | null): Query<DreamInstance>;
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
    pluck<I extends DreamClassTransactionBuilder<DreamInstance>, TableName extends DreamInstance['table'], ColumnType extends DreamColumnNames<DreamInstance>>(this: I, ...fields: (ColumnType | `${TableName}.${ColumnType}`)[]): Promise<any[]>;
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
    pluckEach<I extends DreamClassTransactionBuilder<DreamInstance>, TableName extends DreamInstance['table'], ColumnType extends DreamColumnNames<DreamInstance>, CB extends (plucked: any) => void | Promise<void>>(this: I, ...fields: (ColumnType | `${TableName}.${ColumnType}` | CB | FindEachOpts)[]): Promise<void>;
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
    passthrough<I extends DreamClassTransactionBuilder<DreamInstance>, PassthroughColumns extends PassthroughColumnNames<DreamInstance>>(this: I, passthroughWhereStatement: PassthroughWhere<PassthroughColumns>): Query<DreamInstance>;
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
    where<I extends DreamClassTransactionBuilder<DreamInstance>, DB extends DreamInstance['DB'], Schema extends DreamInstance['schema'], TableName extends AssociationTableNames<DB, Schema> & keyof DB = I['dreamInstance']['table'] & keyof DB>(this: I, attributes: WhereStatement<DB, Schema, TableName>): Query<DreamInstance>;
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
    whereAny<I extends DreamClassTransactionBuilder<DreamInstance>, DB extends DreamInstance['DB'], Schema extends DreamInstance['schema'], TableName extends AssociationTableNames<DB, Schema> & keyof DB = I['dreamInstance']['table'] & keyof DB>(this: I, attributes: WhereStatement<DB, Schema, TableName>[]): Query<DreamInstance>;
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
    whereNot<I extends DreamClassTransactionBuilder<DreamInstance>, DB extends DreamInstance['DB'], Schema extends DreamInstance['schema'], TableName extends AssociationTableNames<DB, Schema> & keyof DB = I['dreamInstance']['table'] & keyof DB>(this: I, attributes: WhereStatement<DB, Schema, TableName>): Query<DreamInstance>;
}
