import { AssociationTableNames } from '../../../db/reflections'
import { WhereStatement } from '../../../decorators/associations/shared'
import Dream from '../../../dream'
import DreamTransaction from '../../transaction'
import associationUpdateQuery from './associationUpdateQuery'

export default async function destroyAssociation<
  DreamInstance extends Dream,
  SyncedAssociations extends DreamInstance['syncedAssociations'],
  AssociationName extends keyof SyncedAssociations[DreamInstance['table']],
  AssociationTableName extends
    SyncedAssociations[DreamInstance['table']][AssociationName] extends (keyof SyncedAssociations)[]
      ? SyncedAssociations[DreamInstance['table']][AssociationName][0]
      : never = SyncedAssociations[DreamInstance['table']][AssociationName] extends (keyof SyncedAssociations)[]
    ? SyncedAssociations[DreamInstance['table']][AssociationName][0]
    : never,
  RestrictedAssociationTableName extends AssociationTableName &
    AssociationTableNames<DreamInstance['DB'], SyncedAssociations> &
    keyof DreamInstance['DB'] = AssociationTableName &
    AssociationTableNames<DreamInstance['DB'], SyncedAssociations> &
    keyof DreamInstance['DB'],
>(
  dream: DreamInstance,
  txn: DreamTransaction<Dream> | null = null,
  associationName: AssociationName,
  opts: WhereStatement<DreamInstance['DB'], SyncedAssociations, RestrictedAssociationTableName> = {}
): Promise<number> {
  const query = associationUpdateQuery(dream, txn, associationName)
  return await query.where(opts as any).destroy()
}
