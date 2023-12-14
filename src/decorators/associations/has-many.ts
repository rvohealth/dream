import Dream from '../../dream'
import {
  HasStatement,
  PartialAssociationStatement,
  TableColumnName,
  WhereStatement,
  applyGetterAndSetter,
  blankAssociationsFactory,
  finalForeignKey,
  foreignKeyTypeField,
} from './shared'
import { AssociationTableNames } from '../../db/reflections'

export default function HasMany<AssociationDreamClass extends typeof Dream>(
  modelCB: () => AssociationDreamClass,
  options:
    | HasManyOptionsWithThrough<AssociationDreamClass>
    | HasManyOptionsWithoutThrough<AssociationDreamClass> = {}
): any {
  return function (target: any, key: string, _: any) {
    const { foreignKey, polymorphic = false, source } = options
    const through = (options as HasManyOptionsWithThrough<AssociationDreamClass>).through
    const where = (options as HasManyOptionsWithoutThrough<AssociationDreamClass>).where
    const whereNot = (options as HasManyOptionsWithoutThrough<AssociationDreamClass>).whereNot
    const distinct = (options as HasManyOptionsWithoutThrough<AssociationDreamClass>).distinct

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
      distinct,
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
}

export interface HasManyOptionsWithThrough<AssociationDreamClass extends typeof Dream>
  extends HasManyOptions<AssociationDreamClass> {
  distinct?: never
  where?: never
  whereNot?: never
  through?: string
}

export interface HasManyOptionsWithoutThrough<AssociationDreamClass extends typeof Dream>
  extends HasManyOptions<AssociationDreamClass> {
  through?: never
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
    | null
}
