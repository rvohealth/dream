import Dream from '../../../dream'
import DreamTransaction from '../../transaction'
import Query from '../../query'
import { HasManyStatement } from '../../../decorators/associations/has-many'
import { HasOneStatement } from '../../../decorators/associations/has-one'
import { BelongsToStatement } from '../../../decorators/associations/belongs-to'

export default function associationUpdateQuery<
  DreamInstance extends Dream,
  TableName extends DreamInstance['table'],
  AssociationName extends keyof DreamInstance['dreamconf']['schema'][TableName &
    keyof DreamInstance['dreamconf']['schema']]['associations'],
  PossibleArrayAssociationType = DreamInstance[AssociationName & keyof DreamInstance],
  AssociationType = PossibleArrayAssociationType extends (infer ElementType)[]
    ? ElementType
    : PossibleArrayAssociationType,
  AssociationQuery = Query<
    AssociationType & Dream,
    DreamInstance['DB'],
    DreamInstance['dreamconf']['schema'],
    DreamInstance['allColumns'],
    keyof DreamInstance['DB'][(AssociationType & Dream)['table']] extends never
      ? never
      : keyof DreamInstance['DB'][(AssociationType & Dream)['table']] & string
  >,
>(
  dream: DreamInstance,
  txn: DreamTransaction<Dream> | null = null,
  associationName: AssociationName
): AssociationQuery {
  const association = dream.associationMap()[associationName as any] as
    | HasManyStatement<any, any, any, any>
    | HasOneStatement<any, any, any, any>
    | BelongsToStatement<any, any, any, any>

  const associationClass = association.modelCB()
  if (Array.isArray(associationClass)) {
    throw new Error('Cannot update a polymorphic association using associationUpdateQuery')
  }

  const dreamClass = dream.constructor as typeof Dream

  const nestedScope = txn
    ? dreamClass.txn(txn).joins(association.as as any)
    : dreamClass.joins(association.as as any)

  const nestedSelect = nestedScope
    .where({ [dream.primaryKey]: dream.primaryKeyValue as any })
    .nestedSelect(`${association.as}.${associationClass.prototype.primaryKey}`)

  const whereClause = {
    [associationClass.prototype.primaryKey]: nestedSelect,
  }

  const query = txn ? associationClass.txn(txn).where(whereClause) : associationClass.where(whereClause)
  return query as AssociationQuery
}
