import Dream from '../../../dream'
import DreamTransaction from '../../transaction'
import Query from '../../query'
import { DreamConstructorType, TableOrAssociationName } from '../../types'
import { HasManyStatement } from '../../../decorators/associations/has-many'

export default function associationQuery<
  DreamInstance extends Dream,
  TableName extends DreamInstance['table'],
  AssociationName extends keyof DreamInstance['syncedAssociations'][TableName],
  PossibleArrayAssociationType = DreamInstance[AssociationName & keyof DreamInstance],
  AssociationType = PossibleArrayAssociationType extends (infer ElementType)[]
    ? ElementType
    : PossibleArrayAssociationType
  // AssociationQuery = Query<DreamConstructorType<AssociationType & Dream>>
>(
  dream: DreamInstance,
  txn: DreamTransaction<DreamInstance['DB']> | null = null,
  associationName: AssociationName
) {
  const association = dream.associationMap()[associationName] as HasManyStatement<any, any, any>
  const associationClass = association.modelCB()

  const dreamClass = dream.constructor as typeof Dream
  const dreamClassOrTransaction = (txn ? dreamClass.txn(txn) : dreamClass) as any

  const baseSelectQuery = dreamClassOrTransaction
    .where({ [dream.primaryKey]: dream.primaryKeyValue })
    // @ts-ignore
    .joins(association.as as any)

  // @ts-ignore
  // TODO: figure out why this type regression was caused. This was workign without
  // ts-ignore prior to refactoring to use ApplicationModel
  return (txn ? associationClass.txn(txn).queryInstance() : associationClass.query())
    ['setBaseSQLAlias'](association.as as TableOrAssociationName<DreamInstance['syncedAssociations']>)
    ['setBaseSelectQuery'](baseSelectQuery as Query<any>) as Query<
    DreamConstructorType<AssociationType & Dream>
  >
}
