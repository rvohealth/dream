import { HasManyStatement } from '../../../decorators/associations/HasMany'
import Dream from '../../../Dream'
import DreamTransaction from '../../DreamTransaction'
import Query from '../../Query'
import {
  AssociationNameToDream,
  DreamAssociationNames,
  JoinOnStatements,
  TableOrAssociationName,
} from '../../types'
import applyScopeBypassingSettingsToQuery from '../applyScopeBypassingSettingsToQuery'

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
    joinOnStatements,
    bypassAllDefaultScopes,
    defaultScopesToBypass,
  }: {
    joinOnStatements: JoinOnStatements<DB, Schema, AssociationTableName, null>
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
    [dream.primaryKey]: dream.primaryKeyValue,
  })

  if (joinOnStatements && (joinOnStatements.on || joinOnStatements.notOn || joinOnStatements.onAny))
    baseSelectQuery = baseSelectQuery.innerJoin(association.as, joinOnStatements)
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
