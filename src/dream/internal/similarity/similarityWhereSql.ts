import { sql, ExpressionBuilder } from 'kysely'
import Dream from '../../../dream'
import OpsStatement from '../../../ops/ops-statement'
import validateTable from '../../../db/validators/validateTable'
import validateColumn from '../../../db/validators/validateColumn'

export default function similarityWhereSql<DreamClass extends typeof Dream>({
  eb,
  tableName,
  columnName,
  opsStatement,
  dbTypeCache,
}: {
  eb: ExpressionBuilder<any, any>
  tableName: InstanceType<DreamClass>['table']
  columnName: string
  opsStatement: OpsStatement<any, any>
  dbTypeCache: any
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
      (coalesce(${eb.ref(validateTable(dbTypeCache, tableName))}.${eb.ref(
        validateColumn(dbTypeCache, tableName, columnName)
      )} :: text, ''))
    ) >= ${opsStatement.minTrigramScore})` as any
}
