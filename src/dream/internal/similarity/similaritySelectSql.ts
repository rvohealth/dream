import { sql, ExpressionBuilder } from 'kysely'
import Dream from '../../../dream'
import OpsStatement from '../../../ops/ops-statement'
import validateTable from '../../../db/validators/validateTable'
import validateColumn from '../../../db/validators/validateColumn'

export default function similaritySelectSql<DreamClass extends typeof Dream>({
  eb,
  tableName,
  columnName,
  opsStatement,
  dbTypeCache,
  rankSQLAlias,
}: {
  eb: ExpressionBuilder<
    InstanceType<DreamClass>['DB'],
    string | (any extends keyof InstanceType<DreamClass>['DB'] ? any : never)
  >
  tableName: InstanceType<DreamClass>['table']
  columnName: string
  opsStatement: OpsStatement<any, any>
  dbTypeCache: any
  rankSQLAlias: string
}) {
  return sql<string>`
  (
    ts_rank(
      (
        to_tsvector(
          'simple',
          coalesce(${eb.ref(validateTable(dbTypeCache, tableName))}.${eb.ref(
    validateColumn(dbTypeCache, tableName, columnName)
  )} :: text, '')
        )
      ),
      (to_tsquery('simple', ''' ' || ${opsStatement.value}::text || ' ''')),
      0
    )
  )`.as(eb.ref(rankSQLAlias))
}
