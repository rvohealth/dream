import { AssociationTableNames } from '../../../db/reflections'
import { WhereStatement } from '../../../decorators/associations/shared'
import Dream from '../../../dream'
import DreamTransaction from '../../transaction'
import associationUpdateQuery from './associationUpdateQuery'

export default async function destroyAssociation<
  DreamInstance extends Dream,
  Schema extends DreamInstance['dreamconf']['schema'],
  AssociationName extends keyof Schema[DreamInstance['table']]['associations'],
  SchemaAssociations = Schema[DreamInstance['table']]['associations'],
  AssociationTableName extends SchemaAssociations[AssociationName] extends (keyof SchemaAssociations)[]
    ? SchemaAssociations[AssociationName][0]
    : never = SchemaAssociations[AssociationName] extends (keyof SchemaAssociations)[]
    ? SchemaAssociations[AssociationName][0]
    : never,
  RestrictedAssociationTableName extends AssociationTableName &
    AssociationTableNames<DreamInstance['DB'], Schema> &
    keyof DreamInstance['DB'] = AssociationTableName &
    AssociationTableNames<DreamInstance['DB'], Schema> &
    keyof DreamInstance['DB'],
>(
  dream: DreamInstance,
  txn: DreamTransaction<Dream> | null = null,
  associationName: AssociationName,
  opts: WhereStatement<DreamInstance['DB'], Schema, RestrictedAssociationTableName> = {}
): Promise<number> {
  const query = associationUpdateQuery(dream, txn, associationName)
  return await query.where(opts as any).destroy()
}
