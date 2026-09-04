import { sql } from 'kysely'
import compact from '../../helpers/compact.js'
import {
  DreamExplainFormat,
  DreamExplainOptions,
  DreamExplainResult,
  QueryOutputMode,
} from '../../types/query.js'

/**
 * @internal
 *
 * A Query's output request (see Query#output): the output mode, plus the
 * explain options when the mode is 'explain'. Threaded into
 * {@link executeDatabaseQuery} by the query driver's read paths.
 */
export interface QueryOutputRequest<Format extends DreamExplainFormat = DreamExplainFormat>
  extends DreamExplainOptions<Format> {
  mode: QueryOutputMode
}

/**
 * @internal
 *
 * The execution funnel for driver-built Kysely statements. By default,
 * executes the provided statement with the provided command and returns the
 * database's results.
 *
 * When an output request is provided (see Query#output), the statement is
 * surfaced instead of executed: the compiled statement is returned for the
 * 'sql' mode, and the database's query plan for the 'explain' mode. Callers
 * that post-process their results are responsible for returning the output
 * untouched when they passed an output request.
 */
export default async function executeDatabaseQuery<
  Command extends DbQueryCommand,
  ReturnType extends Command extends 'execute'
    ? any[]
    : Command extends 'executeTakeFirst'
      ? any
      : Command extends 'executeTakeFirstOrThrow'
        ? any
        : never,
>(kyselyQuery: any, command: Command, output?: QueryOutputRequest): Promise<ReturnType> {
  if (output?.mode === 'sql') return kyselyQuery.compile()
  if (output?.mode === 'explain') return (await explainKyselyQuery(kyselyQuery, output)) as ReturnType

  return await kyselyQuery[command]()
}

/**
 * @internal
 *
 * Asks the database to explain the provided statement, returning the plan:
 * the plan lines when the format is 'text' (the default), or the parsed JSON
 * plan when the format is 'json'. A transaction applied to the Query carries
 * through the statement's executor, so the plan is gathered on the
 * transaction's connection.
 */
async function explainKyselyQuery(
  kyselyQuery: any,
  options: DreamExplainOptions
): Promise<DreamExplainResult> {
  const explainOptions = compact([options.analyze ? 'analyze' : null, options.verbose ? 'verbose' : null])

  const rows: object[] = await kyselyQuery.explain(
    options.format === 'json' ? 'json' : undefined,
    explainOptions.length ? sql.raw(explainOptions.join(', ')) : undefined
  )

  // each plan row carries a single column (Postgres: "QUERY PLAN"), read
  // positionally so this stays agnostic of the engine-specific column name
  const planValues = rows.map(row => Object.values(row)[0])

  if (options.format === 'json') {
    // Postgres renders the JSON plan as a single row holding the plan array;
    // parse defensively in case the driver's type parsers leave json as text
    const rawPlan = planValues[0]
    return (typeof rawPlan === 'string' ? JSON.parse(rawPlan) : rawPlan) as DreamExplainResult
  }

  return planValues as string[]
}

export type DbQueryCommand = 'execute' | 'executeTakeFirst' | 'executeTakeFirstOrThrow'
