import Dream from '../../dream'
import {
  HasStatement,
  PartialAssociationStatement,
  TableColumnName,
  applyGetterAndSetter,
  blankAssociationsFactory,
  finalForeignKey,
  foreignKeyTypeField,
  HasOptions,
  associationPrimaryKeyAccessors,
} from './shared'
import { AssociationTableNames } from '../../db/reflections'

export default function HasMany<
  BaseInstance extends Dream = Dream,
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
    distinct,
    order,
    primaryKeyOverride = null,
  }: HasManyOptions<BaseInstance, AssociationDreamClass> = {}
): any {
  return function (target: BaseInstance, key: string, _: any) {
    const dreamClass: typeof Dream = (target as any).constructor

    if (!Object.getOwnPropertyDescriptor(dreamClass, 'associations'))
      dreamClass['associations'] = blankAssociationsFactory(dreamClass)

    const partialAssociation = associationPrimaryKeyAccessors(
      {
        modelCB,
        type: 'HasMany',
        as: key,
        polymorphic,
        source: source || key,
        preloadThroughColumns,
        where,
        whereNot,
        selfWhere,
        selfWhereNot,
        primaryKeyOverride,
      } as any,
      dreamClass
    )

    const association = {
      ...partialAssociation,
      through,
      distinct,
      order,
      foreignKey() {
        return finalForeignKey(foreignKey, dreamClass, partialAssociation)
      },
      foreignKeyTypeField() {
        return foreignKeyTypeField(foreignKey, dreamClass, partialAssociation)
      },
    } as HasManyStatement<any, any, any, any>

    dreamClass['associations']['hasMany'].push(association)
    applyGetterAndSetter(target as any, association)
  }
}

export interface HasManyStatement<
  BaseInstance extends Dream,
  DB extends any,
  SyncedAssociations extends any,
  ForeignTableName extends AssociationTableNames<DB, SyncedAssociations> & keyof DB,
> extends HasStatement<BaseInstance, DB, SyncedAssociations, ForeignTableName, 'HasMany'> {}

export interface HasManyOptions<BaseInstance extends Dream, AssociationDreamClass extends typeof Dream>
  extends HasOptions<BaseInstance, AssociationDreamClass> {
  distinct?:
    | TableColumnName<
        InstanceType<AssociationDreamClass>['DB'],
        InstanceType<AssociationDreamClass>['syncedAssociations'],
        InstanceType<AssociationDreamClass>['table'] &
          AssociationTableNames<
            InstanceType<AssociationDreamClass>['DB'],
            InstanceType<AssociationDreamClass>['syncedAssociations']
          >
      >
    | boolean
}
