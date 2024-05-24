import { WhereStatement } from '../../../decorators/associations/shared'
import Dream from '../../../dream'
import DreamTransaction from '../../transaction'
import associationUpdateQuery from './associationUpdateQuery'

export default async function destroyAssociation<
  DreamInstance extends Dream,
  DB extends DreamInstance['DB'],
  TableName extends DreamInstance['table'],
  Schema extends DreamInstance['dreamconf']['schema'],
  AssociationName extends keyof DreamInstance,
  Where extends WhereStatement<DB, Schema, TableName>,
>(
  dream: DreamInstance,
  txn: DreamTransaction<Dream> | null = null,
  associationName: AssociationName,
  associationWhereStatement?: Where
): Promise<number> {
  const query = associationUpdateQuery(dream, txn, associationName, associationWhereStatement)
  return await query.destroy()
}
