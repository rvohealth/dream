import { ExpressionBuilder, sql } from 'kysely'
import validateColumn from '../../../db/validators/validateColumn.js.js'
import validateTable from '../../../db/validators/validateTable.js.js'
import Dream from '../../../Dream.js.js'
import OpsStatement from '../../../ops/ops-statement.js.js'

export default function similaritySelectSql<DreamInstance extends Dream>({
  eb,
  tableName,
  columnName,
  opsStatement,
  schema,
  rankSQLAlias,
}: {
  eb: ExpressionBuilder<DreamInstance['DB'], string | (any extends keyof DreamInstance['DB'] ? any : never)>
  tableName: DreamInstance['table']
  columnName: string
  opsStatement: OpsStatement<any, any>
  schema: any
  rankSQLAlias: string
}) {
  return sql<string>`
  (
    ts_rank(
      (
        to_tsvector(
          'simple',
          coalesce(${eb.ref(validateTable(schema, tableName))}.${eb.ref(
            validateColumn(schema, tableName, columnName)
          )} :: text, '')
        )
      ),
      (websearch_to_tsquery('simple', ''' ' || ${opsStatement.value}::text || ' ''')),
      0
    )
  )`.as(eb.ref(rankSQLAlias))
}
