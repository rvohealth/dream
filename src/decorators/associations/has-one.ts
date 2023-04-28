import pluralize = require('pluralize')
import dream from '../../dream'
import { HasStatement, WhereStatement, blankAssociationsFactory } from './shared'
import { AssociationTableNames } from '../../db/reflections'
import Dream from '../../dream'

export default function HasOne<AssociationDreamClass extends typeof Dream>(
  modelCB: () => AssociationDreamClass,
  {
    foreignKey,
    polymorphic = false,
    through,
    throughClass,
    where,
  }: {
    foreignKey?: string
    polymorphic?: boolean
    through?: string
    throughClass?: () => typeof Dream
    where?: WhereStatement<AssociationDreamClass['table']>
  } = {}
): any {
  return function (target: any, key: string, _: any) {
    if ((through && !throughClass) || (throughClass && !through))
      throw `
      Must pass both 'through' and 'throughKey' to through associations
    `
    // TODO: add better validation on through associations
    // TODO: add type guards to through associations if possible

    if (!Object.getOwnPropertyDescriptor(target.constructor, 'associations'))
      target.constructor.associations = blankAssociationsFactory()

    target.constructor.associations['hasOne'].push({
      modelCB,
      type: 'HasOne',
      // TODO: abstract foreign key capture to helper, with optional override provided by the api
      foreignKey() {
        return foreignKey || pluralize.singular(target.constructor.table) + '_id'
      },
      foreignKeyTypeField() {
        return (this.foreignKey() as string).replace(/_id$/, '_type')
      },

      as: key,
      polymorphic,
      through,
      throughClass,
      where,
    })
  }
}
export interface HasOneStatement<ForeignTableName extends AssociationTableNames>
  extends HasStatement<ForeignTableName, 'HasOne'> {}
