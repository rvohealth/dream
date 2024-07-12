import { WhereStatement } from '../../../decorators/associations/shared'
import Dream from '../../../dream'
import DreamTransaction from '../../transaction'
import associationUpdateQuery from './associationUpdateQuery'

export default async function undestroyAssociation<
  DreamInstance extends Dream,
  DB extends DreamInstance['dreamconf']['DB'],
  TableName extends DreamInstance['table'],
  Schema extends DreamInstance['dreamconf']['schema'],
  AssociationName extends keyof DreamInstance,
  Where extends WhereStatement<DB, Schema, TableName>,
>(
  dream: DreamInstance,
  txn: DreamTransaction<Dream> | null = null,
  associationName: AssociationName,
  associationWhereStatement?: Where,
  { skipHooks = false, cascade = false }: { skipHooks?: boolean; cascade?: boolean } = {}
): Promise<number> {
  const query = associationUpdateQuery(dream, txn, associationName, associationWhereStatement, {
    removeAllDefaultScopes: true,
  })
  return await query.removeDefaultScope('dream:SoftDelete').undestroy({ skipHooks, cascade })
}
