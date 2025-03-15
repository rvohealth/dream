import { ExpressionBuilder, sql } from 'kysely'
import validateColumn from '../../../db/validators/validateColumn.js.js'
import validateTable from '../../../db/validators/validateTable.js.js'
import Dream from '../../../Dream.js.js'
import OpsStatement from '../../../ops/ops-statement.js.js'

export default function similarityWhereSql<DreamInstance extends Dream>({
  eb,
  tableName,
  columnName,
  opsStatement,
  schema,
}: {
  eb: ExpressionBuilder<any, any>
  tableName: DreamInstance['table']
  columnName: string
  opsStatement: OpsStatement<any, any>
  schema: any
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

  return sql`(${sql.raw(functionName)}(
      ${opsStatement.value}::text,
      (coalesce(${eb.ref(validateTable(schema, tableName))}.${eb.ref(
        validateColumn(schema, tableName, columnName)
      )} :: text, ''))
    ) >= ${opsStatement.minTrigramScore})` as any
}
