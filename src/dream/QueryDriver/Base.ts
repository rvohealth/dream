import { DeleteQueryBuilder, SelectQueryBuilder, UpdateQueryBuilder } from 'kysely'
import ConnectedToDB from '../../db/ConnectedToDB.js'
import Dream from '../../Dream.js'
import { AssociationStatement } from '../../types/associations/shared.js'
import { DreamColumnNames, DreamTableSchema } from '../../types/dream.js'
import {
  PreloadedDreamsAndWhatTheyPointTo,
  QueryToKyselyDBType,
  QueryToKyselyTableNamesType,
} from '../../types/query.js'
import DreamTransaction from '../DreamTransaction.js'
import Query from '../Query.js'
import PostgresQueryDriver from './Postgres.js'

export default class QueryDriverBase<DreamInstance extends Dream> extends ConnectedToDB<DreamInstance> {
  constructor(public query: Query<DreamInstance, any>) {
    super(query.dreamInstance, query['originalOpts'])
  }

  /**
   * migrate the database. Must respond to the NODE_ENV value.
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  public static async migrate() {
    throw new Error('override migrate in child class')
  }

  /**
   * rollback the database. Must respond to the NODE_ENV value.
   */
  // eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/no-unused-vars
  public static async rollback(_: { steps: number }) {
    throw new Error('override rollback in child class')
  }

  /**
   * create the database. Must respond to the NODE_ENV value.
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  public static async dbCreate() {
    throw new Error('override dbCreate on child class')
  }

  /**
   * delete the database. Must respond to the NODE_ENV value.
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  public static async dbDrop() {
    throw new Error('override dbDrop on child class')
  }

  /**
   * This should build a new migration file in the migrations folder
   * of your application. This will then need to be read and run
   * whenever the `migrate` method is called. The filename should
   * contain a timestamp at the front of the filename, so that it
   * is sorted by date in the file tree, and, more importantly, so
   * they can be run in order by your migration runner.
   */
  // eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/no-unused-vars
  public static async generateMigration(migrationName: string, columnsWithTypes: string[]) {
    throw new Error('override generateMigration in child class')
  }

  /**
   * defines the syncing behavior for dream and psychic,
   * which is run whenever the `sync` command is called.
   * This is an important step, and will be incredibly
   * comlpex to override. You will need to do the following
   * when overriding this method:
   *
   * 1. introspect the db and use it to generate a db.ts file in the
   *    same shape as the existing one. Currently, the process for generating
   *    this file is extremely complex and messy, and will be difficult
   *    to achieve.
   * 2. generate a types/dream.ts file in the same shape as the existing
   *    one. This is normally done using `await new SchemaBuilder().build()`,
   *    but this will likely need to be overridden to tailor to your custom
   *    database engine.
   */
  // eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/no-unused-vars
  public static async sync(_: () => Promise<void> | void) {
    throw new Error('override sync on child class')
  }

  /**
   * Converts the given dream class into a Kysely query, enabling
   * you to build custom queries using the Kysely API
   *
   * ```ts
   * await User.query().toKysely('select').where('email', '=', 'how@yadoin').execute()
   * ```
   *
   * @param type - the type of Kysely query builder instance you would like to obtain
   * @returns A Kysely query. Depending on the type passed, it will return either a SelectQueryBuilder, DeleteQueryBuilder, or an UpdateQueryBuilder
   */
  public toKysely<
    QueryType extends 'select' | 'delete' | 'update',
    DbType = QueryToKyselyDBType<Query<DreamInstance>>,
    TableNames = QueryToKyselyTableNamesType<Query<DreamInstance>>,
    ToKyselyReturnType = QueryType extends 'select'
      ? SelectQueryBuilder<DbType, TableNames & keyof DbType, unknown>
      : QueryType extends 'delete'
        ? DeleteQueryBuilder<DbType, TableNames & keyof DbType, unknown>
        : QueryType extends 'update'
          ? UpdateQueryBuilder<DbType, TableNames & keyof DbType, TableNames & keyof DbType, unknown>
          : never,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  >(type: QueryType): ToKyselyReturnType {
    throw new Error('implement toKysely in child class (if it makes sense)')
  }

  /**
   * @internal
   *
   * This method is used internally by a Query driver to
   * take the result of a single row in a database, and
   * turn that row into the provided dream instance.
   *
   * If needed, the return type can be overriden to
   * explicitly define the resulting dream instance,
   * in cases where a proper type for the dream class
   * cannot be inferred, i.e.
   *
   * ```ts
   * this.dbResultToDreamInstance<typeof Dream, DreamInstance>(result, this.dreamClass)
   * ```
   */
  public dbResultToDreamInstance<DreamClass extends typeof Dream, RetType = InstanceType<DreamClass>>(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    result: any,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    dreamClass: typeof Dream
  ): RetType {
    throw new Error('Implement this in your child driver class')
  }

  /**
   * @internal
   *
   * Used for applying first and last queries
   *
   * @returns A dream instance or null
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  public async takeOne(this: PostgresQueryDriver<DreamInstance>): Promise<DreamInstance | null> {
    throw new Error('implement takeOne in child class')
  }

  /**
   * Retrieves an array containing all records matching the Query.
   * Be careful using this, since it will attempt to pull every
   * record into memory at once. When querying might return a large
   * number of records, consider using `.findEach`, which will pull
   * the records in batches.
   *
   * ```ts
   * await User.query().all()
   * ```
   *
   * @returns an array of dreams
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  public async takeAll(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    options: {
      columns?: DreamColumnNames<DreamInstance>[]
    } = {}
  ): Promise<DreamInstance[]> {
    throw new Error('implement takeAll in child class')
  }

  /**
   * Retrieves the max value of the specified column
   * for this Query
   *
   * ```ts
   * await User.query().max('id')
   * // 99
   * ```
   *
   * @param columnName - a column name on the model
   * @returns the max value of the specified column for this Query
   *
   */
  // eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/no-unused-vars
  public async max(columnName: string): Promise<any> {
    throw new Error('implement max in child class')
  }

  /**
   * Retrieves the min value of the specified column
   * for this Query
   *
   * ```ts
   * await User.query().min('id')
   * // 1
   * ```
   *
   * @param columnName - a column name on the model
   * @returns the min value of the specified column for this Query
   */
  // eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/no-unused-vars
  public async min(columnName: string): Promise<any> {
    throw new Error('implement min in child class')
  }

  /**
   * Retrieves the number of records in the database
   *
   * ```ts
   * await User.query().count()
   * ```
   *
   * @returns The number of records in the database
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  public async count(): Promise<number> {
    throw new Error('implement count in child class')
  }

  /**
   * @internal
   *
   * Runs the query and extracts plucked values
   *
   * @returns An array of plucked values
   */
  // eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/no-unused-vars
  public async pluck(...fields: DreamColumnNames<DreamInstance>[]): Promise<any[]> {
    throw new Error('implement pluck in child class')
  }

  /**
   * Returns a new Kysely SelectQueryBuilder instance to be used
   * in a sub Query
   *
   * ```ts
   * const records = await User.where({
   *   id: Post.query().nestedSelect('userId'),
   * }).all()
   * // [User{id: 1}, ...]
   * ```
   *
   * @param selection - the column to use for your nested Query
   * @returns A Kysely SelectQueryBuilder instance
   */
  public nestedSelect<SimpleFieldType extends keyof DreamColumnNames<DreamInstance>, PluckThroughFieldType>(
    this: PostgresQueryDriver<DreamInstance>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    selection: SimpleFieldType | PluckThroughFieldType
  ) {
    throw new Error('implement nestedSelect in child class')
  }

  /**
   * executes provided query instance as a deletion query.
   * @returns the number of deleted rows
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  public async delete(): Promise<number> {
    throw new Error('implement delete in child class')
  }

  /**
   * executes provided query instance as an update query.
   * @returns the number of updated rows
   */
  // eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/no-unused-vars
  public async update(attributes: DreamTableSchema<DreamInstance>): Promise<number> {
    throw new Error('implement update in child class')
  }

  /**
   * persists any unsaved changes to the database. If a transaction
   * is provided as a second argument, it will use that transaction
   * to encapsulate the persisting of the dream, as well as any
   * subsequent model hooks that are fired.
   */
  // eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/no-unused-vars
  public static async saveDream(dream: Dream, txn: DreamTransaction<Dream> | null = null) {
    throw new Error('implement saveDream in child class')
  }

  /**
   * Returns the sql that would be executed by this Query
   *
   * ```ts
   * User.where({ email: 'how@yadoin' }).sql()
   * // {
   * //  query: {
   * //    kind: 'SelectQueryNode',
   * //    from: { kind: 'FromNode', froms: [Array] },
   * //    selections: [ [Object] ],
   * //    distinctOn: undefined,
   * //    joins: undefined,
   * //    groupBy: undefined,
   * //    orderBy: undefined,
   * //    where: { kind: 'WhereNode', where: [Object] },
   * //    frontModifiers: undefined,
   * //    endModifiers: undefined,
   * //    limit: undefined,
   * //    offset: undefined,
   * //    with: undefined,
   * //    having: undefined,
   * //    explain: undefined,
   * //    setOperations: undefined
   * //  },
   * //  sql: 'select "users".* from "users" where ("users"."email" = $1 and "users"."deleted_at" is null)',
   * //  parameters: [ 'how@yadoin' ]
   * //}
   * ```
   *
   * @returns An object representing the underlying sql statement
   *
   */
  public sql() {
    throw new Error('implement sql in child class')
  }

  /**
   * @internal
   *
   * Used to hydrate dreams with the provided associations
   */
  public hydrateAssociation(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    dreams: Dream[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    association: AssociationStatement,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    preloadedDreamsAndWhatTheyPointTo: PreloadedDreamsAndWhatTheyPointTo[]
  ) {
    throw new Error('define hydrateAssociation on child class')
  }

  /**
   * @internal
   *
   * Used by loadBuider
   */
  // eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/no-unused-vars
  public async hydratePreload(this: QueryDriverBase<DreamInstance>, dream: Dream) {
    throw new Error('define hydratePreload on child class')
  }
}
