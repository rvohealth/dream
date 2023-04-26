import pluralize = require('pluralize')
import Dream from '../../dream'
import { HasStatement, WhereStatement } from './shared'
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
    where?: WhereStatement<AssociationDreamClass['table'] & AssociationTableNames>
  } = {}
): any {
  return function (target: any, key: string, _: any) {
    if ((throughClass && !through) || (through && !throughClass))
      throw `
      Must pass both 'through' and 'throughKey' to through associations
    `
    // TODO: add better validation on through associations
    // TODO: add type guards to through associations if possible

    Object.defineProperty(target.constructor.associations, 'hasMany', {
      value: [
        ...(target.constructor.associations.hasMany as HasManyStatement<any>[]),
        {
          modelCB,
          type: 'HasMany',
          // TODO: abstract foreign key capture to helper, with optional override provided by the api
          foreignKey() {
            return foreignKey || pluralize.singular(target.constructor.table) + '_id'
          },
          foreignKeyTypeField() {
            return (this.foreignKey() as string).replace(/_id$/, '_type')
          },
          as: key,
          polymorphic,
          throughClass,
          through,
          where,
        } as HasManyStatement<any>,
      ] as HasManyStatement<any>[],
    })
  }
}

export interface HasManyStatement<ForeignTableName extends AssociationTableNames>
  extends HasStatement<ForeignTableName, 'HasMany'> {}
