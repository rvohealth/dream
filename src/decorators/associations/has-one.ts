import Dream from '../../dream'
import {
  HasStatement,
  PartialAssociationStatement,
  applyGetterAndSetter,
  blankAssociationsFactory,
  finalForeignKey,
  foreignKeyTypeField,
  HasOptions,
  associationPrimaryKeyAccessors,
} from './shared'
import { AssociationTableNames } from '../../db/reflections'

export default function HasOne<
  BaseInstance extends Dream,
  AssociationDreamClass extends typeof Dream = typeof Dream,
>(
  modelCB: () => AssociationDreamClass,
  {
    foreignKey,
    polymorphic = false,
    source,
    through,
    preloadThroughColumns,
    where,
    whereNot,
    selfWhere,
    selfWhereNot,
    order,
    primaryKeyOverride,
  }: HasOneOptions<BaseInstance, AssociationDreamClass> = {}
): any {
  return function (target: BaseInstance, key: string, _: any) {
    const dreamClass: typeof Dream = (target as any).constructor

    if (!Object.getOwnPropertyDescriptor(dreamClass, 'associations'))
      dreamClass['associations'] = blankAssociationsFactory(dreamClass)

    const partialAssociation = associationPrimaryKeyAccessors(
      {
        modelCB,
        type: 'HasOne',
        as: key,
        polymorphic,
        source: source || key,
        through,
        preloadThroughColumns,
        where,
        whereNot,
        selfWhere,
        selfWhereNot,
        distinct: null,
        order,
        primaryKeyOverride,
      } as any,
      dreamClass
    )

    const association = {
      ...partialAssociation,
      foreignKey() {
        return finalForeignKey(foreignKey, dreamClass, partialAssociation)
      },
      foreignKeyTypeField() {
        return foreignKeyTypeField(foreignKey, dreamClass, partialAssociation)
      },
    } as HasOneStatement<any, any, any, any>

    dreamClass['associations']['hasOne'].push(association)
    applyGetterAndSetter(target, association)
  }
}

export interface HasOneStatement<
  BaseInstance extends Dream,
  DB extends any,
  SyncedAssociations extends any,
  ForeignTableName extends AssociationTableNames<DB, SyncedAssociations> & keyof DB,
> extends HasStatement<BaseInstance, DB, SyncedAssociations, ForeignTableName, 'HasOne'> {}

export interface HasOneOptions<BaseInstance extends Dream, AssociationDreamClass extends typeof Dream>
  extends HasOptions<BaseInstance, AssociationDreamClass> {}
