import Dream from '../../../Dream.js.js'
import DreamTransaction from '../../DreamTransaction.js.js'
import { AssociationNameToDream, DreamAssociationNames, JoinOnStatements } from '../../types.js.js'
import associationUpdateQuery from './associationUpdateQuery.js.js'

export default async function undestroyAssociation<
  DreamInstance extends Dream,
  DB extends DreamInstance['DB'],
  Schema extends DreamInstance['schema'],
  AssociationName extends DreamAssociationNames<DreamInstance>,
  AssociationDream extends AssociationNameToDream<DreamInstance, AssociationName>,
  AssociationTableName extends AssociationDream['table'],
>(
  dream: DreamInstance,
  txn: DreamTransaction<Dream> | null = null,
  associationName: AssociationName,
  {
    joinOnStatements,
    bypassAllDefaultScopes,
    defaultScopesToBypass,
    cascade,
    skipHooks,
  }: {
    joinOnStatements: JoinOnStatements<DB, Schema, AssociationTableName, null>
    bypassAllDefaultScopes: boolean
    defaultScopesToBypass: string[]
    cascade: boolean
    skipHooks: boolean
  }
): Promise<number> {
  const query = associationUpdateQuery(dream, txn, associationName, {
    joinOnStatements,
    bypassAllDefaultScopes,
    defaultScopesToBypass,
  })
  return await query.undestroy({ skipHooks, cascade })
}
