import Dream from '../../../dream'
import DreamTransaction from '../../transaction'
import Query from '../../query'
import { DreamConstructorType, TableOrAssociationName } from '../../types'
import { HasManyStatement } from '../../../decorators/associations/has-many'

export default function associationUpdateQuery<
  DreamInstance extends Dream,
  TableName extends DreamInstance['table'],
  AssociationName extends keyof DreamInstance['syncedAssociations'][TableName],
  PossibleArrayAssociationType = DreamInstance[AssociationName & keyof DreamInstance],
  AssociationType = PossibleArrayAssociationType extends (infer ElementType)[]
    ? ElementType
    : PossibleArrayAssociationType,
  AssociationQuery = Query<DreamConstructorType<AssociationType & Dream>>
>(
  dream: DreamInstance,
  txn: DreamTransaction<DreamInstance['DB']> | null = null,
  associationName: AssociationName
) {
  const association = dream.associationMap()[associationName] as HasManyStatement<any, any, any>
  const associationClass = association.modelCB()

  const dreamClass = dream.constructor as typeof Dream
  const dreamClassOrTransaction = (txn ? dreamClass.txn(txn) : dreamClass) as any

  const nestedScope = txn
    ? dreamClass.txn(txn).joins(association.as as any)
    : dreamClass.joins(association.as as any)

  const nestedSelect = nestedScope
    // @ts-ignore
    .where({ [dream.primaryKey]: dream.primaryKeyValue })
    .nestedSelect(`${association.as}.${associationClass.primaryKey}` as any)

  const whereClause = {
    [associationClass.primaryKey]: nestedSelect,
  }

  return txn
    ? (associationClass.txn(txn).where(whereClause) as AssociationQuery)
    : (associationClass.where(whereClause) as AssociationQuery)
}
