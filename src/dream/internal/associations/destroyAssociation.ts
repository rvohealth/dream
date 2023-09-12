import { SyncedAssociations } from '../../../sync/associations'
import Dream from '../../../dream'
import DreamTransaction from '../../transaction'
import { UpdateablePropertiesForClass } from '../../types'
import { HasManyStatement } from '../../../decorators/associations/has-many'
import { HasOneStatement } from '../../../decorators/associations/has-one'
import { BelongsToStatement } from '../../../decorators/associations/belongs-to'
import CannotDestroyAssociationWithThroughContext from '../../../exceptions/associations/cannot-destroy-association-with-through-context'

export default async function destroyAssociation<
  DreamInstance extends Dream,
  AssociationName extends keyof SyncedAssociations[DreamInstance['table']],
  PossibleArrayAssociationType = DreamInstance[AssociationName & keyof DreamInstance],
  AssociationType = PossibleArrayAssociationType extends (infer ElementType)[]
    ? ElementType
    : PossibleArrayAssociationType
>(
  dream: DreamInstance,
  txn: DreamTransaction | null = null,
  associationName: AssociationName,
  opts: UpdateablePropertiesForClass<AssociationType & typeof Dream> = {}
): Promise<number> {
  const association = dream.associationMap[associationName] as
    | HasManyStatement<any>
    | HasOneStatement<any>
    | BelongsToStatement<any>

  if (Array.isArray(association.modelCB())) {
    throw `
      Cannot destroy polymorphic associations using destroyAssociation
    `
  }
  const associationClass = association.modelCB() as typeof Dream

  switch (association.type) {
    case 'HasMany':
    case 'HasOne':
      if ((association as HasManyStatement<any>).through)
        throw new CannotDestroyAssociationWithThroughContext({
          dreamClass: dream.constructor as typeof Dream,
          association,
        })

      return await associationClass
        // NOTE: do not remove this ts-ignore. It only breaks when other apps
        // load their schemas in.
        // @ts-ignore
        .where({
          [association.foreignKey()]: dream.primaryKeyValue,
          ...opts,
        })
        .destroy()

    case 'BelongsTo':
      // NOTE: dream relies on the database being properly set up with cascade deletion on the foreign key.
      // Our dream generators automatically handle dream in the migration layer by setting col.onDelete('cascade')
      return await (associationClass as any)
        .where({
          [associationClass.primaryKey]: (dream as any)[association.foreignKey()],
        })
        .destroy()
  }
}
