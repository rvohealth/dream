import Dream from '../../dream'
import {
  HasStatement,
  applyGetterAndSetter,
  blankAssociationsFactory,
  finalForeignKey,
  foreignKeyTypeField,
  HasOptions,
  associationPrimaryKeyAccessors,
} from './shared'
import { AssociationTableNames } from '../../db/reflections'
import { TableColumnNames } from '../../dream/types'

export default function HasMany<
  BaseInstance extends Dream = Dream,
  AssociationDreamClass extends typeof Dream = typeof Dream,
>(
  modelCB: () => AssociationDreamClass,
  {
    distinct,
    foreignKey,
    order,
    polymorphic = false,
    preloadThroughColumns,
    primaryKeyOverride = null,
    selfWhere,
    selfWhereNot,
    source,
    through,
    where,
    whereNot,
  }: HasManyOptions<BaseInstance, AssociationDreamClass> = {}
): any {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return function (target: BaseInstance, key: string, _: any) {
    const dreamClass: typeof Dream = (target as any).constructor

    if (!Object.getOwnPropertyDescriptor(dreamClass, 'associations'))
      dreamClass['associationMetadataByType'] = blankAssociationsFactory(dreamClass)

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

    dreamClass['associationMetadataByType']['hasMany'].push(association)
    applyGetterAndSetter(target as any, association)
  }
}

export interface HasManyStatement<
  BaseInstance extends Dream,
  DB,
  Schema,
  ForeignTableName extends AssociationTableNames<DB, Schema> & keyof DB,
> extends HasStatement<BaseInstance, DB, Schema, ForeignTableName, 'HasMany'> {}

export interface HasManyOptions<BaseInstance extends Dream, AssociationDreamClass extends typeof Dream>
  extends HasOptions<BaseInstance, AssociationDreamClass> {
  distinct?:
    | TableColumnNames<
        InstanceType<AssociationDreamClass>['DB'],
        InstanceType<AssociationDreamClass>['table'] &
          AssociationTableNames<
            InstanceType<AssociationDreamClass>['DB'],
            InstanceType<AssociationDreamClass>['dreamconf']['schema']
          >
      >
    | boolean
}
