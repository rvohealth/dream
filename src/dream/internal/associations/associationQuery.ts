import { HasManyStatement } from '../../../decorators/associations/has-many'
import { WhereStatementForAssociation } from '../../../decorators/associations/shared'
import Dream from '../../../dream'
import Query from '../../query'
import DreamTransaction from '../../transaction'
import { DreamAssociationType, TableOrAssociationName } from '../../types'
import applyScopeBypassingSettingsToQuery from '../applyScopeBypassingSettingsToQuery'

export default function associationQuery<
  DreamInstance extends Dream,
  DB extends DreamInstance['DB'],
  TableName extends DreamInstance['table'],
  Schema extends DreamInstance['schema'],
  AssociationName extends keyof DreamInstance,
  Where extends WhereStatementForAssociation<DB, Schema, TableName, AssociationName>,
  AssociationQuery = Query<DreamAssociationType<DreamInstance, AssociationName>>,
>(
  dream: DreamInstance,
  txn: DreamTransaction<Dream> | null = null,
  associationName: AssociationName,
  {
    associationWhereStatement,
    bypassAllDefaultScopes,
    defaultScopesToBypass,
  }: {
    associationWhereStatement?: Where
    bypassAllDefaultScopes: boolean
    defaultScopesToBypass: string[]
  }
): AssociationQuery {
  const association = dream['associationMetadataMap']()[associationName as any] as HasManyStatement<
    any,
    any,
    any,
    any
  >
  const associationClass = association.modelCB()

  const dreamClass = dream.constructor as typeof Dream
  const dreamClassOrTransaction = (txn ? dreamClass.txn(txn) : dreamClass) as typeof dreamClass

  let baseSelectQuery = dreamClassOrTransaction.where({ [dream.primaryKey]: dream.primaryKeyValue })

  if (associationWhereStatement)
    baseSelectQuery = baseSelectQuery.innerJoin(association.as, associationWhereStatement)
  else baseSelectQuery = baseSelectQuery.innerJoin(association.as)

  let query = txn ? associationClass.txn(txn).queryInstance() : associationClass.query()

  query = applyScopeBypassingSettingsToQuery(query, {
    bypassAllDefaultScopes,
    defaultScopesToBypass,
  })

  return query['setBaseSQLAlias'](association.as as TableOrAssociationName<DreamInstance['schema']>)[
    'setAssociationQueryBase'
  ](baseSelectQuery as Query<any>) as AssociationQuery
}
