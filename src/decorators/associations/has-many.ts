import Dream from '../../dream'
import {
  HasStatement,
  PartialAssociationStatement,
  WhereStatement,
  applyGetterAndSetter,
  blankAssociationsFactory,
  finalForeignKey,
  foreignKeyTypeField,
} from './shared'
import { AssociationTableNames } from '../../db/reflections'

export default function HasMany<AssociationDreamClass extends typeof Dream>(
  modelCB: () => AssociationDreamClass,
  {
    foreignKey,
    polymorphic = false,
    source,
    through,
    where,
    whereNot,
  }: {
    foreignKey?: string
    polymorphic?: boolean
    source?: string
    through?: string
    where?: WhereStatement<
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
  } = {}
): any {
  return function (target: any, key: string, _: any) {
    const dreamClass: typeof Dream = target.constructor

    if (!Object.getOwnPropertyDescriptor(dreamClass, 'associations'))
      dreamClass.associations = blankAssociationsFactory(dreamClass)

    const partialAssociation = {
      modelCB,
      type: 'HasMany',
      as: key,
      polymorphic,
      source: source || key,
      through,
      where,
      whereNot,
    } as PartialAssociationStatement

    const association = {
      ...partialAssociation,
      foreignKey() {
        return finalForeignKey(foreignKey, dreamClass, partialAssociation)
      },
      foreignKeyTypeField() {
        return foreignKeyTypeField(foreignKey, dreamClass, partialAssociation)
      },
    } as HasManyStatement<any, any, any>

    dreamClass.associations['hasMany'].push(association)
    applyGetterAndSetter(target, association)
  }
}

export interface HasManyStatement<
  DB extends any,
  SyncedAssociations extends any,
  ForeignTableName extends AssociationTableNames<DB, SyncedAssociations> & keyof DB
> extends HasStatement<DB, SyncedAssociations, ForeignTableName, 'HasMany'> {}
