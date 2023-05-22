import pluralize = require('pluralize')
import Dream from '../../dream'
import { HasStatement, WhereStatement, blankAssociationsFactory } from './shared'
import { AssociationTableNames } from '../../db/reflections'
import Query from '../../dream/query'
import { HasOneStatement } from './has-one'

export default function HasMany<AssociationDreamClass extends typeof Dream>(
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
      source: source || key,
      through,
      where,
    })

    // Object.defineProperty(target, `${key}Query`, {
    //   get: function (this: Dream) {
    //     const association = this.associationMap[key] as HasManyStatement<any>
    //     const associationClass = association.modelCB()
    //     const nestedSelect = (this.constructor as typeof Dream)
    //       .joins(association.as)
    //       .nestedSelect(`${association.as}.${associationClass.primaryKey}` as any)
    //     return associationClass.where({ [associationClass.primaryKey]: nestedSelect })
    //   },
    // })
  }
}

export interface HasManyStatement<ForeignTableName extends AssociationTableNames>
  extends HasStatement<ForeignTableName, 'HasMany'> {}
