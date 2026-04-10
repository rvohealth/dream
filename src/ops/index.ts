import { ComparisonOperatorExpression as KyselyComparisonOperatorExpression, sql } from 'kysely'
import Dream from '../Dream.js'
import AnyRequiresArrayColumn from '../errors/ops/AnyRequiresArrayColumn.js'
import cachedTypeForAttribute from '../helpers/db/cachedTypeForAttribute.js'
import isDatabaseArrayColumn from '../helpers/db/types/isDatabaseArrayColumn.js'
import { TrigramOperator } from '../types/dream.js'
import CurriedOpsStatement from './curried-ops-statement.js'
import OpsStatement from './ops-statement.js'

type ArrayOperatorType = 'in' | 'not in'

const ops = {
  /**
   * Creates an `OpsStatement` with an arbitrary Kysely comparison operator or trigram operator.
   * Use this as an escape hatch when none of the named helpers cover your use case.
   *
   * @param operator - Any Kysely comparison operator (e.g. `'='`, `'<'`) or trigram operator.
   * @param value - The value to compare against.
   * @returns An `OpsStatement` wrapping the given operator and value.
   *
   * @example
   * User.where({ name: ops.expression('like', '%ello%') })
   */
  expression: <
    const T,
    const Operator extends KyselyComparisonOperatorExpression | TrigramOperator,
    const ComputedT extends Operator extends ArrayOperatorType ? (T & Readonly<unknown[]>)[number] : T,
  >(
    operator: Operator,
    value: T
  ): OpsStatement<Operator, ComputedT, any> => new OpsStatement(operator, value as unknown as ComputedT),

  /**
   * Creates an `OpsStatement` that checks whether a JSONB column contains the given object
   * using the PostgreSQL `@>` (contains) operator.
   *
   * @param searchObj - A plain object whose key/value pairs must be present in the JSONB column.
   * @returns An `OpsStatement` using `@> <searchObj>::jsonb`.
   *
   * @example
   * Post.where({ metadata: ops.jsonb({ published: true }) })
   */
  jsonb: (searchObj: object) => new OpsStatement('@>', sql`${searchObj}::jsonb`),

  /**
   * Creates an `OpsStatement` for a SQL `IN` clause, matching rows whose column value
   * is one of the provided array elements.
   *
   * @param arr - The array of values to match against.
   * @returns An `OpsStatement` using the `in` operator.
   *
   * @example
   * User.where({ status: ops.in(['active', 'pending']) })
   */
  in: <const T extends unknown[]>(arr: T) => new OpsStatement<'in', T[number]>('in', arr as T[number]),

  /**
   * Creates a `CurriedOpsStatement` that checks whether a PostgreSQL array column contains
   * the given value using `@> ARRAY[value]::type`. The column type is resolved at query-build
   * time from the Dream model's schema.
   *
   * Throws `AnyRequiresArrayColumn` if the target column is not a database array type.
   *
   * @param value - The scalar value that must be present in the array column.
   * @returns A `CurriedOpsStatement` that resolves to an `OpsStatement` once bound to a model and field.
   *
   * @example
   * Post.where({ tags: ops.any('typescript') })
   */
  any: <const AnyT>(value: AnyT): CurriedOpsStatement<any, any, any, AnyT> =>
    new CurriedOpsStatement(function <
      T extends typeof Dream,
      DB extends InstanceType<T>['DB'],
      FN extends keyof DB[InstanceType<T>['table']] & string,
      AnyT,
    >(dreamClass: T, fieldName: FN): OpsStatement<any, AnyT, any> {
      const column = fieldName.replace(/^.*\./, '')
      if (!isDatabaseArrayColumn(dreamClass, column)) throw new AnyRequiresArrayColumn(dreamClass, column)
      const castType = cachedTypeForAttribute(dreamClass, column)
      return new OpsStatement('@>', sql`ARRAY[${sql.join([value])}]::${sql.raw(castType)}`) as OpsStatement<
        '@>',
        AnyT
      >
    }) as CurriedOpsStatement<any, any, any, AnyT>,

  /**
   * Creates an `OpsStatement` using the SQL `LIKE` operator for case-sensitive pattern matching.
   * Use `%` as a wildcard in the pattern string.
   *
   * @param like - The pattern string (e.g. `'%hello%'`).
   * @returns An `OpsStatement` using the `like` operator.
   *
   * @example
   * User.where({ name: ops.like('%alice%') })
   */
  like: (like: string) => new OpsStatement('like', like),

  /**
   * Creates an `OpsStatement` using the SQL `ILIKE` operator for case-insensitive pattern matching.
   * Use `%` as a wildcard in the pattern string.
   *
   * @param ilike - The pattern string (e.g. `'%hello%'`).
   * @returns An `OpsStatement` using the `ilike` operator.
   *
   * @example
   * User.where({ name: ops.ilike('%alice%') })
   */
  ilike: (ilike: string) => new OpsStatement('ilike', ilike),

  /**
   * Creates an `OpsStatement` that matches a column against a POSIX regular expression.
   * By default the match is case-sensitive (`~`); pass `{ caseInsensitive: true }` to use `~*`.
   *
   * @param match - The regular expression pattern.
   * @param options.caseInsensitive - When `true`, uses the `~*` operator instead of `~`. Defaults to `false`.
   * @returns An `OpsStatement` using `~` or `~*`.
   *
   * @example
   * User.where({ email: ops.match('^admin', { caseInsensitive: true }) })
   */
  match: (match: string, { caseInsensitive = false }: { caseInsensitive?: boolean } = {}) =>
    new OpsStatement(caseInsensitive ? '~*' : '~', match),

  /**
   * Creates an `OpsStatement` using the `=` operator for strict equality.
   *
   * @param equal - The value the column must equal.
   * @returns An `OpsStatement` using the `=` operator.
   *
   * @example
   * User.where({ role: ops.equal('admin') })
   */
  equal: <const T>(equal: T) => new OpsStatement('=', equal),

  /**
   * Creates an `OpsStatement` using the `<` operator.
   *
   * @param lessThan - The value the column must be less than.
   * @returns An `OpsStatement` using the `<` operator.
   *
   * @example
   * Order.where({ total: ops.lessThan(100) })
   */
  lessThan: <const T>(lessThan: T) => new OpsStatement('<', lessThan),

  /**
   * Creates an `OpsStatement` using the `<=` operator.
   *
   * @param lessThanOrEqualTo - The value the column must be less than or equal to.
   * @returns An `OpsStatement` using the `<=` operator.
   *
   * @example
   * Order.where({ total: ops.lessThanOrEqualTo(100) })
   */
  lessThanOrEqualTo: <const T>(lessThanOrEqualTo: T) => new OpsStatement('<=', lessThanOrEqualTo),

  /**
   * Creates an `OpsStatement` using the `>` operator.
   *
   * @param greaterThan - The value the column must be greater than.
   * @returns An `OpsStatement` using the `>` operator.
   *
   * @example
   * Order.where({ total: ops.greaterThan(50) })
   */
  greaterThan: <const T>(greaterThan: T) => new OpsStatement('>', greaterThan),

  /**
   * Creates an `OpsStatement` using the `>=` operator.
   *
   * @param greaterThanOrEqualTo - The value the column must be greater than or equal to.
   * @returns An `OpsStatement` using the `>=` operator.
   *
   * @example
   * Order.where({ total: ops.greaterThanOrEqualTo(50) })
   */
  greaterThanOrEqualTo: <const T>(greaterThanOrEqualTo: T) => new OpsStatement('>=', greaterThanOrEqualTo),

  /**
   * Creates an `OpsStatement` for PostgreSQL trigram similarity (`%` operator).
   * Rows are included when the similarity score meets or exceeds `score`.
   *
   * Requires the `pg_trgm` extension to be enabled.
   *
   * @param similarity - The string to compare against the column.
   * @param options.score - Minimum similarity threshold (0–1). Defaults to `0.3`.
   * @returns An `OpsStatement` using the `%` trigram operator.
   *
   * @example
   * User.where({ name: ops.similarity('alice', { score: 0.4 }) })
   */
  similarity: (similarity: string, { score = 0.3 }: { score?: number } = {}) =>
    new OpsStatement('%', similarity, { score }),

  /**
   * Creates an `OpsStatement` for PostgreSQL word similarity (`<%` operator).
   * Rows are included when the word similarity score meets or exceeds `score`.
   *
   * Requires the `pg_trgm` extension to be enabled.
   *
   * @param similarity - The string to compare against the column.
   * @param options.score - Minimum word similarity threshold (0–1). Defaults to `0.5`.
   * @returns An `OpsStatement` using the `<%` trigram operator.
   *
   * @example
   * Article.where({ title: ops.wordSimilarity('postgres', { score: 0.6 }) })
   */
  wordSimilarity: (similarity: string, { score = 0.5 }: { score?: number } = {}) =>
    new OpsStatement('<%', similarity, { score }),

  /**
   * Creates an `OpsStatement` for PostgreSQL strict word similarity (`<<%` operator).
   * Rows are included when the strict word similarity score meets or exceeds `score`.
   *
   * Requires the `pg_trgm` extension to be enabled.
   *
   * @param similarity - The string to compare against the column.
   * @param options.score - Minimum strict word similarity threshold (0–1). Defaults to `0.6`.
   * @returns An `OpsStatement` using the `<<%` trigram operator.
   *
   * @example
   * Article.where({ title: ops.strictWordSimilarity('postgres', { score: 0.7 }) })
   */
  strictWordSimilarity: (similarity: string, { score = 0.6 }: { score?: number } = {}) =>
    new OpsStatement('<<%', similarity, { score }),

  /** Negated variants of the standard comparison operators. */
  not: {
    /**
     * Creates an `OpsStatement` for a SQL `NOT IN` clause, excluding rows whose column value
     * is one of the provided array elements.
     *
     * @param arr - The array of values to exclude.
     * @returns An `OpsStatement` using the `not in` operator.
     *
     * @example
     * User.where({ status: ops.not.in(['banned', 'deleted']) })
     */
    in: <const T extends unknown[]>(arr: T) => new OpsStatement<'not in', T[number]>('not in', arr),

    /**
     * Creates an `OpsStatement` using the `NOT LIKE` operator for case-sensitive pattern exclusion.
     *
     * @param like - The pattern string (e.g. `'%spam%'`).
     * @returns An `OpsStatement` using the `not like` operator.
     *
     * @example
     * User.where({ email: ops.not.like('%@example.com') })
     */
    like: (like: string) => new OpsStatement('not like', like),

    /**
     * Creates an `OpsStatement` using the `NOT ILIKE` operator for case-insensitive pattern exclusion.
     *
     * @param ilike - The pattern string (e.g. `'%spam%'`).
     * @returns An `OpsStatement` using the `not ilike` operator.
     *
     * @example
     * User.where({ email: ops.not.ilike('%@example.com') })
     */
    ilike: (ilike: string) => new OpsStatement('not ilike', ilike),

    /**
     * Creates an `OpsStatement` that excludes rows matching a POSIX regular expression.
     * By default the match is case-sensitive (`!~`); pass `{ caseInsensitive: true }` to use `!~*`.
     *
     * @param match - The regular expression pattern.
     * @param options.caseInsensitive - When `true`, uses `!~*` instead of `!~`. Defaults to `false`.
     * @returns An `OpsStatement` using `!~` or `!~*`.
     *
     * @example
     * User.where({ email: ops.not.match('^admin', { caseInsensitive: true }) })
     */
    match: (match: string, { caseInsensitive = false }: { caseInsensitive?: boolean } = {}) =>
      new OpsStatement(caseInsensitive ? '!~*' : '!~', match),

    /**
     * Creates an `OpsStatement` using the `!=` operator for inequality.
     *
     * @param equal - The value the column must not equal.
     * @returns An `OpsStatement` using the `!=` operator.
     *
     * @example
     * User.where({ role: ops.not.equal('guest') })
     */
    equal: <const T>(equal: T) => new OpsStatement('!=', equal),

    /**
     * Creates an `OpsStatement` that negates `<`, equivalent to `>=`.
     *
     * @param lessThan - The value used as the lower bound (inclusive).
     * @returns An `OpsStatement` using `>=`.
     *
     * @example
     * Order.where({ total: ops.not.lessThan(100) }) // total >= 100
     */
    lessThan: <const T>(lessThan: T) => new OpsStatement('>=', lessThan),

    /**
     * Creates an `OpsStatement` that negates `<=`, equivalent to `>`.
     *
     * @param lessThanOrEqualTo - The value used as the lower bound (exclusive).
     * @returns An `OpsStatement` using `>`.
     *
     * @example
     * Order.where({ total: ops.not.lessThanOrEqualTo(100) }) // total > 100
     */
    lessThanOrEqualTo: <const T>(lessThanOrEqualTo: T) => new OpsStatement('>', lessThanOrEqualTo),

    /**
     * Creates an `OpsStatement` that negates `>`, equivalent to `<=`.
     *
     * @param greaterThan - The value used as the upper bound (inclusive).
     * @returns An `OpsStatement` using `<=`.
     *
     * @example
     * Order.where({ total: ops.not.greaterThan(50) }) // total <= 50
     */
    greaterThan: <const T>(greaterThan: T) => new OpsStatement('<=', greaterThan),

    /**
     * Creates an `OpsStatement` that negates `>=`, equivalent to `<`.
     *
     * @param greaterThanOrEqualTo - The value used as the upper bound (exclusive).
     * @returns An `OpsStatement` using `<`.
     *
     * @example
     * Order.where({ total: ops.not.greaterThanOrEqualTo(50) }) // total < 50
     */
    greaterThanOrEqualTo: <const T>(greaterThanOrEqualTo: T) => new OpsStatement('<', greaterThanOrEqualTo),
  },
}

export default ops
