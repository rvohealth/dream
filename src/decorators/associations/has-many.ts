import pluralize = require('pluralize')
import dream from '../../dream'
import { DB } from '../../sync/schema'
import { HasStatement, WhereStatement } from './shared'

export default function HasMany<TableName extends keyof DB & string>(
  TableName: TableName,
  modelCB: () => ReturnType<typeof dream<TableName, any>>,
  {
    throughClass,
    through,
    where,
  }: {
    throughClass?: () => ReturnType<typeof dream<any, any>>
    through?: string
    where?: WhereStatement<TableName>
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
          to: TableName,
          // TODO: abstract foreign key capture to helper, with optional override provided by the api
          foreignKey: () =>
            throughClass
              ? pluralize.singular(throughClass().table) + '_id'
              : pluralize.singular(target.constructor.table) + '_id',
          as: key,
          throughClass,
          through,
          where,
        } as HasManyStatement<any>,
      ] as HasManyStatement<any>[],
    })
  }
}

export interface HasManyStatement<ForeignTableName extends keyof DB & string>
  extends HasStatement<ForeignTableName, 'HasMany'> {}
