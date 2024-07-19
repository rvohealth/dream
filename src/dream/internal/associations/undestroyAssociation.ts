import { WhereStatement } from '../../../decorators/associations/shared'
import Dream from '../../../dream'
import DreamTransaction from '../../transaction'
import associationUpdateQuery from './associationUpdateQuery'

export default async function undestroyAssociation<
  DreamInstance extends Dream,
  DB extends DreamInstance['DB'],
  TableName extends DreamInstance['table'],
  Schema extends DreamInstance['schema'],
  AssociationName extends keyof DreamInstance,
  Where extends WhereStatement<DB, Schema, TableName>,
>(
  dream: DreamInstance,
  txn: DreamTransaction<Dream> | null = null,
  associationName: AssociationName,
  {
    associationWhereStatement,
    bypassAllDefaultScopes,
    defaultScopesToBypass,
    cascade,
    skipHooks,
  }: {
    associationWhereStatement?: Where
    bypassAllDefaultScopes: boolean
    defaultScopesToBypass: string[]
    cascade: boolean
    skipHooks: boolean
  }
): Promise<number> {
  const query = associationUpdateQuery(dream, txn, associationName, {
    associationWhereStatement,
    bypassAllDefaultScopes,
    defaultScopesToBypass,
  })
  return await query.undestroy({ skipHooks, cascade })
}
