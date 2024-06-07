import Dream from '../dream'
import { DreamColumnNames } from '../dream/types'
import NoDefaultOrderableColumn from '../exceptions/NoDefaultOrderableColumn'
import primaryKeyIsOrderable from './primaryKeyIsOrderable'

export default function defaultColumnForOrdering<T extends typeof Dream>(
  dreamClass: T
): DreamColumnNames<InstanceType<T>>[number] {
  if (dreamClass.prototype.defaultOrderableColumn) return dreamClass.prototype.defaultOrderableColumn

  const pkType =
    dreamClass.prototype.dreamconf.schema[dreamClass.prototype.table]?.['columns']?.[
      dreamClass.prototype.primaryKey
    ]?.['dbType']
  if (primaryKeyIsOrderable(pkType)) return dreamClass.primaryKey

  const hasCreatedAtField =
    !!dreamClass.prototype.dreamconf.schema?.[dreamClass.prototype.table]?.['columns']?.[
      dreamClass.prototype.createdAtField
    ]
  if (hasCreatedAtField) return dreamClass.prototype.createdAtField

  throw new NoDefaultOrderableColumn(dreamClass)
}
