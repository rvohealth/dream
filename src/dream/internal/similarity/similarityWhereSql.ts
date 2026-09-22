import { ExpressionBuilder, sql } from 'kysely'
import validateColumn from '../../../db/validators/validateColumn.js'
import validateTable from '../../../db/validators/validateTable.js'
import validateTableAlias from '../../../db/validators/validateTableAlias.js'
import Dream from '../../../Dream.js'
import OpsStatement from '../../../ops/ops-statement.js'

export default function similarityWhereSql<DreamInstance extends Dream>({
  eb,
  tableName,
  columnName,
  opsStatement,
  schema,
  tableAlias,
}: {
  eb: ExpressionBuilder<any, any>
  tableName: DreamInstance['table']
  columnName: string
  opsStatement: OpsStatement<any, any>
  schema: any
  /**
   * When the table is joined under an alias (e.g. `heartRatings` for the `extra_ratings`
   * table), the column must be referenced through that alias rather than the table name.
   */
  tableAlias?: string | undefined
}) {
  let functionName: 'similarity' | 'word_similarity' | 'strict_word_similarity' = 'similarity'

  switch (opsStatement.operator) {
    case '<%':
      functionName = 'word_similarity'
      break

    case '<<%':
      functionName = 'strict_word_similarity'
      break
  }

  const tableRef = tableAlias
    ? eb.ref(validateTableAlias(tableAlias))
    : eb.ref(validateTable(schema, tableName))

  return sql`(${sql.raw(functionName)}(
      ${opsStatement.value}::text,
      (coalesce(${tableRef}.${eb.ref(validateColumn(schema, tableName, columnName))} :: text, ''))
    ) >= ${opsStatement.minTrigramScore})` as any
}
