import Dream from '../../Dream.js'
import isDatabaseArrayColumn from '../../helpers/db/types/isDatabaseArrayColumn.js'
import ops from '../../ops/index.js'
import { WhereStatement } from '../../types/associations/shared.js'
import { UpdateablePropertiesForClass } from '../../types/dream.js'

/**
 * Builds the `findBy` statement that findOrCreateBy, createOrFindBy,
 * updateOrCreateBy and createOrUpdateBy use to look up an existing record.
 * Their attributes are both the lookup and the values to persist, so an array
 * given for an array column is the whole array to store: the lookup compares
 * it with `ops.equal`, matching only a record whose array equals it
 * element-for-element, in order, instead of the `IN` a plain list means in a
 * where clause.
 */
export default function findOrCreateLookupStatement<T extends typeof Dream>(
  dreamClass: T,
  attributes: UpdateablePropertiesForClass<T>
): WhereStatement<InstanceType<T>> {
  const lookup = dreamClass['extractAttributesFromUpdateableProperties'](attributes) as Record<
    string,
    unknown
  >

  return Object.fromEntries(
    Object.entries(lookup).map(([column, value]) => [
      column,
      Array.isArray(value) && isDatabaseArrayColumn(dreamClass, column as any) ? ops.equal(value) : value,
    ])
  ) as WhereStatement<InstanceType<T>>
}
