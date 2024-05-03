import Dream from '../../../dream'
import DreamTransaction from '../../transaction'
import Query from '../../query'
import { TableOrAssociationName } from '../../types'
import { HasManyStatement } from '../../../decorators/associations/has-many'

export default function associationQuery<
  DreamInstance extends Dream,
  TableName extends DreamInstance['table'],
  AssociationName extends keyof DreamInstance['dreamconf']['schema'][TableName &
    keyof DreamInstance['dreamconf']['schema']]['associations'],
  PossibleArrayAssociationType = DreamInstance[AssociationName & keyof DreamInstance],
  AssociationType extends Dream = PossibleArrayAssociationType extends (infer ElementType)[]
    ? ElementType extends Dream
      ? ElementType
      : never
    : PossibleArrayAssociationType extends Dream
      ? PossibleArrayAssociationType
      : never,
  AssociationQuery = Query<AssociationType>,
>(
  dream: DreamInstance,
  txn: DreamTransaction<Dream> | null = null,
  associationName: AssociationName
): AssociationQuery {
  const association = dream.associationMap()[associationName as any] as HasManyStatement<any, any, any, any>
  const associationClass = association.modelCB()

  const dreamClass = dream.constructor as typeof Dream
  const dreamClassOrTransaction = (txn ? dreamClass.txn(txn) : dreamClass) as any

  const baseSelectQuery = dreamClassOrTransaction
    .where({ [dream.primaryKey]: dream.primaryKeyValue })
    .joins(association.as as any)

  return (txn ? associationClass.txn(txn).queryInstance() : associationClass.query())
    ['setBaseSQLAlias'](association.as as TableOrAssociationName<DreamInstance['dreamconf']['schema']>)
    ['setBaseSelectQuery'](baseSelectQuery as Query<any>) as AssociationQuery
}
