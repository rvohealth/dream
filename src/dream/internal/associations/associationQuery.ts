import Dream from '../../../Dream.js'
import { HasManyStatement } from '../../../types/associations/hasMany.js'
import {
  AssociationNameToDream,
  DreamAssociationNames,
  JoinAndStatements,
  TableOrAssociationName,
} from '../../../types/dream.js'
import DreamTransaction from '../../DreamTransaction.js'
import Query from '../../Query.js'
import applyScopeBypassingSettingsToQuery from '../applyScopeBypassingSettingsToQuery.js'

export default function associationQuery<
  DreamInstance extends Dream,
  DB extends DreamInstance['DB'],
  Schema extends DreamInstance['schema'],
  AssociationName extends DreamAssociationNames<DreamInstance>,
  AssociationDream extends AssociationNameToDream<DreamInstance, AssociationName>,
  AssociationTableName extends AssociationDream['table'],
  AssociationQuery = Query<AssociationNameToDream<DreamInstance, AssociationName>>,
>(
  dream: DreamInstance,
  txn: DreamTransaction<Dream> | null = null,
  associationName: AssociationName,
  {
    joinAndStatements,
    bypassAllDefaultScopes,
    defaultScopesToBypass,
  }: {
    joinAndStatements: JoinAndStatements<DB, Schema, AssociationTableName, null>
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

  let baseSelectQuery: Query<Dream, any> = dreamClassOrTransaction.where({
    [dream['_primaryKey']]: dream.primaryKeyValue(),
  })

  if (joinAndStatements && (joinAndStatements.and || joinAndStatements.andNot || joinAndStatements.andAny))
    baseSelectQuery = baseSelectQuery.innerJoin(association.as, joinAndStatements)
  else baseSelectQuery = baseSelectQuery.innerJoin(association.as)

  let query = txn ? associationClass.txn(txn).queryInstance() : associationClass.query()

  query = applyScopeBypassingSettingsToQuery(query, {
    bypassAllDefaultScopes,
    defaultScopesToBypass,
  })

  return query['setBaseSQLAlias'](association.as as TableOrAssociationName<DreamInstance['schema']>)[
    'setAssociationQueryBase'
  ](baseSelectQuery as Query<any, any>) as AssociationQuery
}
