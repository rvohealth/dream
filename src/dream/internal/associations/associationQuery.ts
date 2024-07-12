import { BelongsToStatement } from '../../../decorators/associations/belongs-to'
import { HasManyStatement } from '../../../decorators/associations/has-many'
import { HasOneStatement } from '../../../decorators/associations/has-one'
import { WhereStatement } from '../../../decorators/associations/shared'
import Dream from '../../../dream'
import Query from '../../query'
import DreamTransaction from '../../transaction'
import { DreamAssociationType, TableOrAssociationName } from '../../types'
import shouldBypassDefaultScope from '../shouldBypassDefaultScope'

export default function associationQuery<
  DreamInstance extends Dream,
  DB extends DreamInstance['dreamconf']['DB'],
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
  const dreamClassOrTransaction = (txn ? dreamClass.txn(txn) : dreamClass) as typeof Dream

  let baseSelectQuery = dreamClassOrTransaction.where({ [dream.primaryKey]: dream.primaryKeyValue })

  if (associationWhereStatement)
    baseSelectQuery = baseSelectQuery.joins(association.as, associationWhereStatement)
  else baseSelectQuery = baseSelectQuery.joins(association.as)

  let query = (txn ? associationClass.txn(txn).queryInstance() : associationClass.query())
    ['setBaseSQLAlias'](association.as as TableOrAssociationName<DreamInstance['dreamconf']['schema']>)
    ['setBaseSelectQuery'](baseSelectQuery as Query<any>) as AssociationQuery

  query = conditionallyApplyScopesForAssociation(
    query as Query<DreamAssociationType<DreamInstance, AssociationName>>,
    association
  ) as AssociationQuery

  return query
}

function conditionallyApplyScopesForAssociation<DreamInstance extends Dream>(
  query: Query<DreamInstance>,
  association:
    | HasOneStatement<any, any, any, any>
    | HasManyStatement<any, any, any, any>
    | BelongsToStatement<any, any, any, any>
) {
  if (query['bypassAllDefaultScopes']) return query

  const thisScopes = query.dreamClass['scopes'].default
  const hasAssociation = association as
    | HasOneStatement<any, any, any, any>
    | HasManyStatement<any, any, any, any>

  for (const scope of thisScopes) {
    if (shouldBypassDefaultScope(scope.method, hasAssociation.withoutDefaultScopes)) {
      query = query.removeDefaultScope(scope.method)
    }
  }

  return query
}
