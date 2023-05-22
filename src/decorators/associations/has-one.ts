import pluralize = require('pluralize')
import { HasStatement, WhereStatement, blankAssociationsFactory } from './shared'
import { AssociationTableNames } from '../../db/reflections'
import Dream from '../../dream'

export default function HasOne<AssociationDreamClass extends typeof Dream>(
  modelCB: () => AssociationDreamClass,
  {
    foreignKey,
    polymorphic = false,
    source,
    through,
    where,
  }: {
    foreignKey?: string
    polymorphic?: boolean
    source?: string
    through?: string
    where?: WhereStatement<InstanceType<AssociationDreamClass>['table'] & AssociationTableNames>
  } = {}
): any {
  return function (target: any, key: string, _: any) {
    const dreamClass: typeof Dream = target.constructor

    // TODO: add better validation on through associations
    // TODO: add type guards to through associations if possible
    if (!Object.getOwnPropertyDescriptor(dreamClass, 'associations'))
      dreamClass.associations = blankAssociationsFactory(dreamClass)

    dreamClass.associations['hasOne'].push({
      modelCB,
      type: 'HasOne',
      foreignKey() {
        return foreignKey || pluralize.singular(target.table) + '_id'
      },
      foreignKeyTypeField() {
        return (this.foreignKey() as string).replace(/_id$/, '_type')
      },

      as: key,
      polymorphic,
      source: source || key,
      through,
      where,
    })
  }
}

export interface HasOneStatement<ForeignTableName extends AssociationTableNames>
  extends HasStatement<ForeignTableName, 'HasOne'> {}
