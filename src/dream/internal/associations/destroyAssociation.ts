import { WhereStatement } from '../../../decorators/associations/shared'
import Dream from '../../../Dream2'
import DreamTransaction from '../../DreamTransaction'
import associationUpdateQuery from './associationUpdateQuery'

export default async function destroyAssociation<
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
    reallyDestroy,
    skipHooks,
  }: {
    associationWhereStatement?: Where
    bypassAllDefaultScopes: boolean
    defaultScopesToBypass: string[]
    cascade: boolean
    reallyDestroy: boolean
    skipHooks: boolean
  }
): Promise<number> {
  const query = associationUpdateQuery(dream, txn, associationName, {
    associationWhereStatement,
    bypassAllDefaultScopes,
    defaultScopesToBypass,
  })
  if (reallyDestroy) {
    return await query.reallyDestroy({ skipHooks, cascade })
  } else {
    return await query.destroy({ skipHooks, cascade })
  }
}
