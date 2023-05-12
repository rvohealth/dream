import pluralize = require('pluralize')
import Dream from '../../dream'
import { HasStatement, WhereStatement, blankAssociationsFactory } from './shared'
import { AssociationTableNames } from '../../db/reflections'

export default function HasMany<AssociationDreamClass extends typeof Dream>(
  modelCB: () => AssociationDreamClass,
  {
    foreignKey,
    polymorphic = false,
    throughClass,
    through,
    where,
  }: {
    foreignKey?: string
    polymorphic?: boolean
    throughClass?: () => typeof Dream
    through?: string
    where?: WhereStatement<InstanceType<AssociationDreamClass>['table'] & AssociationTableNames>
  } = {}
): any {
  return function (target: any, key: string, _: any) {
    const dreamClass: typeof Dream = target.constructor

    if ((throughClass && !through) || (through && !throughClass))
      throw `
      Must pass both 'through' and 'throughKey' to through associations
    `
    // TODO: add better validation on through associations
    // TODO: add type guards to through associations if possible
    if (!Object.getOwnPropertyDescriptor(dreamClass, 'associations'))
      dreamClass.associations = blankAssociationsFactory(dreamClass)

    dreamClass.associations['hasMany'].push({
      modelCB,
      type: 'HasMany',
      foreignKey() {
        return foreignKey || pluralize.singular(target.table) + '_id'
      },
      foreignKeyTypeField() {
        return (this.foreignKey() as string).replace(/_id$/, '_type')
      },
      as: key,
      polymorphic,
      throughClass,
      through,
      where,
    })
  }
}

export interface HasManyStatement<ForeignTableName extends AssociationTableNames>
  extends HasStatement<ForeignTableName, 'HasMany'> {}
