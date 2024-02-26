import Dream from '../../dream'
import {
  AssociationWhereStatement,
  HasStatement,
  OrderStatement,
  PartialAssociationStatement,
  TableColumnName,
  WhereSelfStatement,
  WhereStatement,
  applyGetterAndSetter,
  blankAssociationsFactory,
  finalForeignKey,
  foreignKeyTypeField,
} from './shared'
import { AssociationTableNames } from '../../db/reflections'

export default function HasOne<AssociationDreamClass extends typeof Dream>(
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
  }: {
    foreignKey?: string
    polymorphic?: boolean
    source?: string
    through?: string
    preloadThroughColumns?: string[]
    where?: AssociationWhereStatement<
      InstanceType<AssociationDreamClass>['DB'],
      InstanceType<AssociationDreamClass>['syncedAssociations'],
      InstanceType<AssociationDreamClass>['table'] &
        AssociationTableNames<
          InstanceType<AssociationDreamClass>['DB'],
          InstanceType<AssociationDreamClass>['syncedAssociations']
        >
    >

    whereNot?: WhereStatement<
      InstanceType<AssociationDreamClass>['DB'],
      InstanceType<AssociationDreamClass>['syncedAssociations'],
      InstanceType<AssociationDreamClass>['table'] &
        AssociationTableNames<
          InstanceType<AssociationDreamClass>['DB'],
          InstanceType<AssociationDreamClass>['syncedAssociations']
        >
    >

    selfWhere?: WhereSelfStatement<
      InstanceType<AssociationDreamClass>['DB'],
      InstanceType<AssociationDreamClass>['syncedAssociations'],
      InstanceType<AssociationDreamClass>['table'] &
        AssociationTableNames<
          InstanceType<AssociationDreamClass>['DB'],
          InstanceType<AssociationDreamClass>['syncedAssociations']
        >
    >

    selfWhereNot?: WhereSelfStatement<
      InstanceType<AssociationDreamClass>['DB'],
      InstanceType<AssociationDreamClass>['syncedAssociations'],
      InstanceType<AssociationDreamClass>['table'] &
        AssociationTableNames<
          InstanceType<AssociationDreamClass>['DB'],
          InstanceType<AssociationDreamClass>['syncedAssociations']
        >
    >

    order?:
      | OrderStatement<
          InstanceType<AssociationDreamClass>['DB'],
          InstanceType<AssociationDreamClass>['syncedAssociations'],
          InstanceType<AssociationDreamClass>['table'] &
            AssociationTableNames<
              InstanceType<AssociationDreamClass>['DB'],
              InstanceType<AssociationDreamClass>['syncedAssociations']
            >
        >
      | OrderStatement<
          InstanceType<AssociationDreamClass>['DB'],
          InstanceType<AssociationDreamClass>['syncedAssociations'],
          InstanceType<AssociationDreamClass>['table'] &
            AssociationTableNames<
              InstanceType<AssociationDreamClass>['DB'],
              InstanceType<AssociationDreamClass>['syncedAssociations']
            >
        >[]
  } = {}
): any {
  return function (target: any, key: string, _: any) {
    const dreamClass: typeof Dream = target.constructor

    if (!Object.getOwnPropertyDescriptor(dreamClass, 'associations'))
      dreamClass['associations'] = blankAssociationsFactory(dreamClass)

    const partialAssociation = {
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
    } as PartialAssociationStatement

    const association = {
      ...partialAssociation,
      foreignKey() {
        return finalForeignKey(foreignKey, dreamClass, partialAssociation)
      },
      foreignKeyTypeField() {
        return foreignKeyTypeField(foreignKey, dreamClass, partialAssociation)
      },
    } as HasOneStatement<any, any, any>

    dreamClass['associations']['hasOne'].push(association)
    applyGetterAndSetter(target, association)
  }
}

export interface HasOneStatement<
  DB extends any,
  SyncedAssociations extends any,
  ForeignTableName extends AssociationTableNames<DB, SyncedAssociations> & keyof DB,
> extends HasStatement<DB, SyncedAssociations, ForeignTableName, 'HasOne'> {}
