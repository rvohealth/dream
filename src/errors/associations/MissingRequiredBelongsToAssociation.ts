import Dream from '../../Dream.js'

/**
 * Thrown when a non-optional (`optional: false`) BelongsTo association is null
 * at the moment its getter is accessed.
 *
 * A non-optional BelongsTo is typed non-null and serializes to a non-nullable
 * field in the generated OpenAPI spec — "required" means "always present". When
 * the loaded value is nevertheless null, this error fails loud in place of a
 * cryptic null-deref deep in serialization. It arises when the associated row is
 * absent for one of these reasons:
 *
 * - The associated row was hard-deleted, leaving a dangling foreign key. This
 *   usually signals a missing `dependent: 'destroy'` on the inverse
 *   `HasOne`/`HasMany`.
 * - An internal or default scope (such as soft-delete) filtered the associated
 *   row out at load time.
 *
 * The fix is one of:
 *
 * - Add `dependent: 'destroy'` to the inverse `HasOne`/`HasMany` so the parent
 *   cannot outlive its children, or
 * - Mark the BelongsTo `optional: true` if the parent can legitimately be absent
 *   (which makes the field nullable in the OpenAPI spec).
 *
 * Note that an *explicit* load-time constraint on a required BelongsTo (e.g.
 * `preload('parent', { and: {...} })`) is forbidden at compile time rather than
 * surfacing here at runtime; see {@link BelongsTo}.
 */
export default class MissingRequiredBelongsToAssociation extends Error {
  public dreamClass: typeof Dream
  public associationName: string
  public foreignKey: string
  public foreignKeyValue: unknown
  public foreignKeyTypeField: string | null
  public foreignKeyTypeValue: unknown
  public polymorphic: boolean

  constructor({
    dreamClass,
    associationName,
    foreignKey,
    foreignKeyValue,
    foreignKeyTypeField = null,
    foreignKeyTypeValue = null,
    polymorphic,
  }: {
    dreamClass: typeof Dream
    associationName: string
    foreignKey: string
    foreignKeyValue: unknown
    foreignKeyTypeField?: string | null
    foreignKeyTypeValue?: unknown
    polymorphic: boolean
  }) {
    super()
    this.dreamClass = dreamClass
    this.associationName = associationName
    this.foreignKey = foreignKey
    this.foreignKeyValue = foreignKeyValue
    this.foreignKeyTypeField = foreignKeyTypeField
    this.foreignKeyTypeValue = foreignKeyTypeValue
    this.polymorphic = polymorphic
  }

  public override get message() {
    return `
Attempting to access required BelongsTo association \`${this.associationName}\` on an instance of \`${this.dreamClass.sanitizedName}\`,
but the loaded association is null.

${this.foreignKeyMessage}

If the associated record was deleted, check whether the inverse HasOne/HasMany association should specify dependent: 'destroy'.
`
  }

  private get foreignKeyMessage() {
    if (this.foreignKeyValue === null || this.foreignKeyValue === undefined) {
      return `The foreign key \`${this.foreignKey}\` is null, which violates this non-optional BelongsTo association.`
    }

    return [
      `The foreign key \`${this.foreignKey}\` is set to \`${this.formatValue(this.foreignKeyValue)}\`, but no associated record was loaded.`,
      this.polymorphic && this.foreignKeyTypeField
        ? `The polymorphic type field \`${this.foreignKeyTypeField}\` is set to \`${this.formatValue(this.foreignKeyTypeValue)}\`.`
        : null,
    ]
      .filter(Boolean)
      .join('\n')
  }

  private formatValue(value: unknown) {
    if (value === null) return 'null'
    if (value === undefined) return 'undefined'
    if (typeof value === 'string') return value
    if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint')
      return value.toString()
    if (typeof value === 'symbol') return value.description ?? value.toString()
    if (typeof value === 'function') return value.name || '[function]'
    return JSON.stringify(value)
  }
}
