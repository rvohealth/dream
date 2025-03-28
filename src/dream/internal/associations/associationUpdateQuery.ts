import Dream from '../../../Dream.js'
import UnexpectedUndefined from '../../../errors/UnexpectedUndefined.js'
import namespaceColumn from '../../../helpers/namespaceColumn.js'
import { AssociationNameToDream, DreamAssociationNames, JoinOnStatements } from '../../../types/dream.js'
import DreamTransaction from '../../DreamTransaction.js'
import Query from '../../Query.js'
import applyScopeBypassingSettingsToQuery from '../applyScopeBypassingSettingsToQuery.js'

export default function associationUpdateQuery<
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
  const association = dream['associationMetadataMap']()[associationName as any]
  if (association === undefined) throw new UnexpectedUndefined()

  const associationClass = association.modelCB()
  if (Array.isArray(associationClass)) {
    throw new Error('Cannot update a polymorphic association using associationUpdateQuery')
  }

  const dreamClass = dream.constructor as typeof Dream

  let nestedScope: Query<Dream, any> = txn
    ? (dreamClass.txn(txn) as unknown as Query<Dream>)
    : dreamClass.query()

  nestedScope = applyScopeBypassingSettingsToQuery(nestedScope, {
    bypassAllDefaultScopes,
    defaultScopesToBypass,
  })

  if (joinOnStatements && (joinOnStatements.on || joinOnStatements.notOn || joinOnStatements.onAny))
    nestedScope = nestedScope.innerJoin(association.as, joinOnStatements)
  else nestedScope = nestedScope.innerJoin(association.as)

  const nestedSelect = nestedScope
    .where({ [dream.primaryKey]: dream.primaryKeyValue as any })
    .nestedSelect(namespaceColumn(associationClass.primaryKey, association.as))

  const whereClause = {
    [associationClass.primaryKey]: nestedSelect,
  }

  let query = txn ? associationClass.txn(txn).where(whereClause) : associationClass.where(whereClause)

  query = applyScopeBypassingSettingsToQuery(query, {
    bypassAllDefaultScopes,
    defaultScopesToBypass,
  })

  return query as AssociationQuery
}
