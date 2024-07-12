import { BelongsToStatement } from '../../../decorators/associations/belongs-to'
import { HasManyStatement } from '../../../decorators/associations/has-many'
import { HasOneStatement } from '../../../decorators/associations/has-one'
import { WhereStatement } from '../../../decorators/associations/shared'
import Dream from '../../../dream'
import Query from '../../query'
import DreamTransaction from '../../transaction'
import { DreamAssociationType } from '../../types'
import applyScopeBypassingSettingsToQuery from '../applyScopeBypassingSettingsToQuery'

export default function associationUpdateQuery<
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
  const association = dream['associationMetadataMap']()[associationName as any] as
    | HasManyStatement<any, any, any, any>
    | HasOneStatement<any, any, any, any>
    | BelongsToStatement<any, any, any, any>

  const associationClass = association.modelCB()
  if (Array.isArray(associationClass)) {
    throw new Error('Cannot update a polymorphic association using associationUpdateQuery')
  }

  const dreamClass = dream.constructor as typeof Dream

  let nestedScope: Query<Dream> = txn ? (dreamClass.txn(txn) as unknown as Query<Dream>) : dreamClass.query()

  nestedScope = applyScopeBypassingSettingsToQuery(nestedScope, {
    bypassAllDefaultScopes,
    defaultScopesToBypass,
  })

  if (associationWhereStatement) nestedScope = nestedScope.joins(association.as, associationWhereStatement)
  else nestedScope = nestedScope.joins(association.as)

  const nestedSelect = nestedScope
    .where({ [dream.primaryKey]: dream.primaryKeyValue as any })
    .nestedSelect(`${association.as}.${associationClass.primaryKey}`)

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
