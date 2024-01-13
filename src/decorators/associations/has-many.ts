import Dream from '../../dream'
import {
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

export default function HasMany<AssociationDreamClass extends typeof Dream>(
  modelCB: () => AssociationDreamClass,
  options: HasManyOptions<AssociationDreamClass> = {}
): any {
  return function (target: any, key: string, _: any) {
    const { foreignKey, polymorphic = false, source } = options
    const through = options.through
    const where = options.where
    const whereNot = options.whereNot
    const selfWhere = options.selfWhere
    const distinct = options.distinct
    const order = options.order

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
      selfWhere,
      distinct,
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

export type HasManyOptions<AssociationDreamClass extends typeof Dream> = {
  foreignKey?: string
  polymorphic?: boolean
  source?: string
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
  selfWhere?: WhereSelfStatement<
    InstanceType<AssociationDreamClass>['DB'],
    InstanceType<AssociationDreamClass>['syncedAssociations'],
    InstanceType<AssociationDreamClass>['table'] &
      AssociationTableNames<
        InstanceType<AssociationDreamClass>['DB'],
        InstanceType<AssociationDreamClass>['syncedAssociations']
      >
  >
  order?: OrderStatement<
    InstanceType<AssociationDreamClass>['DB'],
    InstanceType<AssociationDreamClass>['syncedAssociations'],
    InstanceType<AssociationDreamClass>['table'] &
      AssociationTableNames<
        InstanceType<AssociationDreamClass>['DB'],
        InstanceType<AssociationDreamClass>['syncedAssociations']
      >
  >
  through?: string
}
