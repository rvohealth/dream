import Dream from '../../Dream.js'
import CannotIgnorePrimaryKey from '../../errors/schema-builder/CannotIgnorePrimaryKey.js'
import CannotIgnoreStiTypeColumn from '../../errors/schema-builder/CannotIgnoreStiTypeColumn.js'
import ConflictingIgnoredColumns from '../../errors/schema-builder/ConflictingIgnoredColumns.js'
import uniq from '../uniq.js'

/**
 * @internal
 *
 * Resolves the set of ignored columns for a table from the `ignoredColumns`
 * declarations of every model backed by that table, validating the
 * declarations along the way. Called while `sync` builds the generated types
 * files (the declarations have no runtime behavior; see the `ignoredColumns`
 * getter on Dream), so each of these guards fails the sync command loudly
 * rather than surfacing as broken behavior at runtime:
 *
 * - a model may never ignore its primary key
 * - an STI model may never ignore the STI "type" column
 * - models sharing a table must agree on their ignored columns, since there
 *   is only one generated schema per table (STI children inherit the base
 *   model's getter, so agreement is automatic unless a child overrides it)
 *
 * @param models - every model backed by the table
 * @param tableName - the table whose ignored columns are being resolved
 * @returns the set of column names to omit from the table's generated types
 */
export default function resolveIgnoredColumns(models: (typeof Dream)[], tableName: string): Set<string> {
  models.forEach(modelClass => {
    const ignoredColumns = modelClass.prototype.ignoredColumns

    if (ignoredColumns.includes(modelClass.primaryKey)) throw new CannotIgnorePrimaryKey(modelClass)

    if (ignoredColumns.includes('type') && (modelClass['isSTIBase'] || modelClass['isSTIChild']))
      throw new CannotIgnoreStiTypeColumn(modelClass)
  })

  const distinctDeclarations = uniq(
    models.map(modelClass => JSON.stringify(uniq([...modelClass.prototype.ignoredColumns]).sort()))
  )
  if (distinctDeclarations.length > 1) throw new ConflictingIgnoredColumns(tableName, models)

  return new Set(models.flatMap(modelClass => [...modelClass.prototype.ignoredColumns]))
}
