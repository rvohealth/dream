import Dream from '../../../dream'
import DreamTransaction from '../../transaction'
import Query from '../../query'
import { DreamAssociationType, TableOrAssociationName } from '../../types'
import { HasManyStatement } from '../../../decorators/associations/has-many'
import { WhereStatement } from '../../../decorators/associations/shared'

export default function associationQuery<
  DreamInstance extends Dream,
  DB extends DreamInstance['DB'],
  TableName extends DreamInstance['table'],
  Schema extends DreamInstance['dreamconf']['schema'],
  AssociationName extends keyof DreamInstance,
  Where extends WhereStatement<DB, Schema, TableName>,
  AssociationQuery = Query<DreamAssociationType<DreamInstance, AssociationName>>,
>(
  dream: DreamInstance,
  txn: DreamTransaction<Dream> | null = null,
  associationName: AssociationName,
  associationWhereStatement?: Where
): AssociationQuery {
  const association = dream['associationMetadataMap']()[associationName as any] as HasManyStatement<
    any,
    any,
    any,
    any
  >
  const associationClass = association.modelCB()

  const dreamClass = dream.constructor as typeof Dream
  const dreamClassOrTransaction = (txn ? dreamClass.txn(txn) : dreamClass) as any

  let baseSelectQuery = dreamClassOrTransaction.where({ [dream.primaryKey]: dream.primaryKeyValue })

  if (associationWhereStatement)
    baseSelectQuery = baseSelectQuery.joins(association.as, associationWhereStatement)
  else baseSelectQuery = baseSelectQuery.joins(association.as)

  return (txn ? associationClass.txn(txn).queryInstance() : associationClass.query())
    ['setBaseSQLAlias'](association.as as TableOrAssociationName<DreamInstance['dreamconf']['schema']>)
    ['setBaseSelectQuery'](baseSelectQuery as Query<any>) as AssociationQuery
}
