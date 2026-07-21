import scopeArray from '../../decorators/field/sortable/helpers/scopeArray.js'
import Dream from '../../Dream.js'
import CannotIgnoreAssociationColumn from '../../errors/schema-builder/CannotIgnoreAssociationColumn.js'
import CannotIgnoreEncryptedColumn from '../../errors/schema-builder/CannotIgnoreEncryptedColumn.js'
import CannotIgnorePrimaryKey from '../../errors/schema-builder/CannotIgnorePrimaryKey.js'
import CannotIgnoreSoftDeleteColumn from '../../errors/schema-builder/CannotIgnoreSoftDeleteColumn.js'
import CannotIgnoreSortablePositionColumn from '../../errors/schema-builder/CannotIgnoreSortablePositionColumn.js'
import CannotIgnoreSortableScopeColumn from '../../errors/schema-builder/CannotIgnoreSortableScopeColumn.js'
import CannotIgnoreStiTypeColumn from '../../errors/schema-builder/CannotIgnoreStiTypeColumn.js'
import ConflictingIgnoredColumns from '../../errors/schema-builder/ConflictingIgnoredColumns.js'
import IgnoredColumnMustBeCamelCase from '../../errors/schema-builder/IgnoredColumnMustBeCamelCase.js'
import { HasManyStatement } from '../../package-exports/types.js'
import { AssociationStatement } from '../../types/associations/shared.js'
import camelize from '../camelize.js'
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
 * - ignored columns must be declared in camelCase, since generated column
 *   names are camelized, so any other shape can never match a generated
 *   column and would be silently inert
 * - a model may never ignore its primary key
 * - an STI model may never ignore the STI "type" column
 * - a model may never ignore an @Sortable position field or a plain-column
 *   @Sortable scope, the backing column of an @Encrypted property, or (on a
 *   SoftDelete model) its deletedAtField — the framework reads and writes
 *   those columns by name
 * - models sharing a table must agree on their ignored columns, since there
 *   is only one generated schema per table (STI children inherit the base
 *   model's getter, so agreement is automatic unless a child overrides it)
 * - no association anywhere in the app may name an ignored column as the
 *   foreign key (or polymorphic type field) it reads and writes on this
 *   table — a BelongsTo on a model backed by this table names a foreign key
 *   on this table, and so does a HasMany/HasOne on any other model that
 *   points at a model backed by this table
 * - no association anywhere in the app may name an ignored column as its
 *   primaryKeyOverride — the column the association's foreign key points
 *   at, which lives on the associated model's table for a BelongsTo and on
 *   the declaring model's own table for a HasMany/HasOne
 *
 * @param models - every model backed by the table
 * @param tableName - the table whose ignored columns are being resolved
 * @param allModels - every model in the app (on the table's connection);
 *   required because associations declared on other models can name foreign
 *   keys on this table
 * @returns the set of column names to omit from the table's generated types
 */
export default function resolveIgnoredColumns(
  models: (typeof Dream)[],
  tableName: string,
  allModels: (typeof Dream)[]
): Set<string> {
  models.forEach(modelClass => {
    const ignoredColumns = modelClass.prototype.ignoredColumns

    ignoredColumns.forEach(columnName => {
      if (camelize(columnName) !== columnName) throw new IgnoredColumnMustBeCamelCase(modelClass, columnName)
    })

    if (ignoredColumns.includes(modelClass.primaryKey)) throw new CannotIgnorePrimaryKey(modelClass)

    if (ignoredColumns.includes('type') && (modelClass['isSTIBase'] || modelClass['isSTIChild']))
      throw new CannotIgnoreStiTypeColumn(modelClass)

    modelClass['sortableFields'].forEach(sortableFieldConfig => {
      if (ignoredColumns.includes(sortableFieldConfig.positionField))
        throw new CannotIgnoreSortablePositionColumn(modelClass, sortableFieldConfig.positionField)

      // a Sortable scope entry names either a column or a BelongsTo
      // association on the model (getColumnForSortableScope resolves columns
      // first, then falls back to association metadata), so an ignored scope
      // entry only breaks @Sortable when no association answers to the name
      scopeArray(sortableFieldConfig.scope).forEach(scopeEntry => {
        if (
          ignoredColumns.includes(scopeEntry) &&
          modelClass['associationMetadataMap']()[scopeEntry] === undefined
        )
          throw new CannotIgnoreSortableScopeColumn(modelClass, scopeEntry, sortableFieldConfig.positionField)
      })
    })

    // the Encrypted decorator records each backing column it manages in
    // explicitUnsafeParamColumns (which nothing else populates)
    modelClass['explicitUnsafeParamColumns'].forEach(columnName => {
      if (ignoredColumns.includes(columnName)) throw new CannotIgnoreEncryptedColumn(modelClass, columnName)
    })

    if (modelClass['softDelete']) {
      const deletedAtField = modelClass.prototype['_deletedAtField']
      if (ignoredColumns.includes(deletedAtField))
        throw new CannotIgnoreSoftDeleteColumn(modelClass, deletedAtField)
    }
  })

  const distinctDeclarations = uniq(
    models.map(modelClass => JSON.stringify(uniq([...modelClass.prototype.ignoredColumns]).sort()))
  )
  if (distinctDeclarations.length > 1) throw new ConflictingIgnoredColumns(tableName, models)

  const ignoredColumns = new Set(models.flatMap(modelClass => [...modelClass.prototype.ignoredColumns]))

  if (ignoredColumns.size) guardAssociationColumns(ignoredColumns, tableName, allModels)

  return ignoredColumns
}

/**
 * @internal
 *
 * fails the sync when an ignored column of the table is the foreign key (or
 * polymorphic type field) that any association in the app reads and writes
 * on this table, or the primaryKeyOverride column that any association's
 * foreign key points at on this table. A BelongsTo association names a
 * foreign key on the declaring model's own table and a primaryKeyOverride
 * on the associated model's table; a HasMany/HasOne association names a
 * foreign key on the associated model's table and a primaryKeyOverride on
 * the declaring model's own table — so the load-bearing association may be
 * declared on any model in the app, not just the models backed by this
 * table.
 */
function guardAssociationColumns(
  ignoredColumns: Set<string>,
  tableName: string,
  allModels: (typeof Dream)[]
): void {
  for (const modelClass of allModels) {
    for (const associationName of modelClass.associationNames) {
      const associationMetaData = modelClass['associationMetadataMap']()[associationName]
      if (associationMetaData === undefined) continue
      // a through association names no foreign key of its own; the source
      // association it travels through is guarded directly
      if ((associationMetaData as HasManyStatement<any, any, any, any>).through) continue

      // unlike foreignKey(), primaryKeyOverride is a plain string on the
      // association statement, so it can be guarded without consulting the
      // generated schema — before the foreignKey-specific short-circuits below
      const primaryKeyOverride = associationMetaData.primaryKeyOverride
      if (
        primaryKeyOverride &&
        ignoredColumns.has(primaryKeyOverride) &&
        primaryKeyOverrideTableForAssociationMatches(associationMetaData, modelClass, tableName)
      )
        throw new CannotIgnoreAssociationColumn(
          tableName,
          primaryKeyOverride,
          modelClass,
          associationMetaData,
          'primary key override'
        )

      if (!foreignKeyTableForAssociationMatches(associationMetaData, modelClass, tableName)) continue

      // NOTE
      // this try-catch mirrors getAssociationData in ASTConnectionBuilder:
      // computing foreignKey() introspects columns via the generated schema
      // file, so it may throw — on the first sync pass because the schema
      // file has not been regenerated yet, and on the second pass because
      // the regenerated schema omits the ignored column. So in orderings
      // where foreignKey() throws on the first pass, it throws on the second
      // pass too, and these guards never see the association's foreign key;
      // the InvalidComputedForeignKey / ExplicitForeignKeyRequired errors
      // swallowed here resurface at runtime as the backstop.
      let foreignKey: string | null = null
      let foreignKeyTypeColumn: string | null = null
      try {
        foreignKey = associationMetaData.foreignKey()
        foreignKeyTypeColumn = associationMetaData.polymorphic
          ? associationMetaData.foreignKeyTypeField()
          : null
      } catch {
        continue
      }

      if (ignoredColumns.has(foreignKey))
        throw new CannotIgnoreAssociationColumn(
          tableName,
          foreignKey,
          modelClass,
          associationMetaData,
          'foreign key'
        )

      if (foreignKeyTypeColumn && ignoredColumns.has(foreignKeyTypeColumn))
        throw new CannotIgnoreAssociationColumn(
          tableName,
          foreignKeyTypeColumn,
          modelClass,
          associationMetaData,
          'polymorphic type field'
        )
    }
  }
}

/**
 * @internal
 *
 * returns whether the given association's foreign key physically lives on
 * the given table: on the declaring model's own table for a BelongsTo, and
 * on the associated model's table for a HasMany/HasOne
 */
function foreignKeyTableForAssociationMatches(
  associationMetaData: AssociationStatement,
  modelClass: typeof Dream,
  tableName: string
): boolean {
  if (associationMetaData.type === 'BelongsTo') return modelClass.table === tableName

  const dreamClassOrClasses = associationMetaData.modelCB()
  // a missing associated class raises FailedToIdentifyAssociation while the
  // builder gathers association data; it is not this guard's concern
  if (!dreamClassOrClasses) return false

  return Array.isArray(dreamClassOrClasses)
    ? dreamClassOrClasses.some(dreamClass => dreamClass.table === tableName)
    : dreamClassOrClasses.table === tableName
}

/**
 * @internal
 *
 * returns whether the given association's primaryKeyOverride column
 * physically lives on the given table — the opposite side from the foreign
 * key (see associationPrimaryKeyAccessors in
 * decorators/field/association/shared.ts): on the associated model's table
 * for a BelongsTo, and on the declaring model's own table for a
 * HasMany/HasOne
 */
function primaryKeyOverrideTableForAssociationMatches(
  associationMetaData: AssociationStatement,
  modelClass: typeof Dream,
  tableName: string
): boolean {
  if (associationMetaData.type !== 'BelongsTo') return modelClass.table === tableName

  const dreamClassOrClasses = associationMetaData.modelCB()
  // a missing associated class raises FailedToIdentifyAssociation while the
  // builder gathers association data; it is not this guard's concern
  if (!dreamClassOrClasses) return false

  return Array.isArray(dreamClassOrClasses)
    ? dreamClassOrClasses.some(dreamClass => dreamClass.table === tableName)
    : dreamClassOrClasses.table === tableName
}
