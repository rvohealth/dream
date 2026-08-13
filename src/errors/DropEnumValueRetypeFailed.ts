/**
 * A check constraint discovered on the column `dropEnumValue` was retyping.
 */
export interface DropEnumValueCheckConstraint {
  /** the constraint's name in `pg_constraint`, e.g. `pets_species_check` */
  name: string
  /** the constraint as Postgres renders it, e.g. `CHECK (((species)::text <> 'forg'::text))` */
  definition: string
}

export interface DropEnumValueRetypeFailedOpts {
  enumName: string
  value: string
  table: string
  column: string
  /**
   * `toText` for the widen step that runs before the enum type is dropped and
   * recreated; `toEnum` for the restore step that runs after it.
   */
  retypeDirection: 'toText' | 'toEnum'
  checkConstraints: DropEnumValueCheckConstraint[]
  originalError: Error
}

/**
 * Raised when one of the two column retypes inside
 * `DreamMigrationHelpers.dropEnumValue` fails.
 *
 * The raw Postgres error for the common cause of this - a check constraint on the
 * column that references the enum - is `operator does not exist: text <> my_enum`.
 * It names no table, no column and no constraint, and the `text` in it comes from
 * `dropEnumValue`'s own internal widen step, so it appears nowhere in the
 * migration the developer wrote. This error supplies all of that, and keeps the
 * original error reachable through both `originalError` and `cause`.
 */
export default class DropEnumValueRetypeFailed extends Error {
  public readonly enumName: string
  public readonly value: string
  public readonly table: string
  public readonly column: string
  public readonly retypeDirection: 'toText' | 'toEnum'
  public readonly checkConstraints: DropEnumValueCheckConstraint[]
  public readonly originalError: Error

  constructor({
    enumName,
    value,
    table,
    column,
    retypeDirection,
    checkConstraints,
    originalError,
  }: DropEnumValueRetypeFailedOpts) {
    super(undefined, { cause: originalError })
    this.enumName = enumName
    this.value = value
    this.table = table
    this.column = column
    this.retypeDirection = retypeDirection
    this.checkConstraints = checkConstraints
    this.originalError = originalError
  }

  public override get message() {
    return `
DreamMigrationHelpers.dropEnumValue failed while retyping ${this.table}.${this.column}.

  enum:                ${this.enumName}
  value being dropped: '${this.value}'
  table:               ${this.table}
  column:              ${this.column}
  failing step:        ${this.failingStepDescription}

${this.stepExplanation}

${this.checkConstraintsSection}

${this.guidanceSection}

The original database error was:

  ${this.originalError.message}
`
  }

  private get failingStepDescription() {
    return this.retypeDirection === 'toText'
      ? `widening ${this.column} to text`
      : `restoring ${this.column} to ${this.enumName}`
  }

  private get stepExplanation() {
    if (this.retypeDirection === 'toText') {
      return `dropEnumValue temporarily retypes every column listed in \`replacements\` to text so that
the ${this.enumName} type can be dropped and recreated without '${this.value}'. That text type is
dropEnumValue's own internal step, which is why the database error below can name a
type your migration never mentioned.`
    }

    return `dropEnumValue recreated ${this.enumName} without '${this.value}' and was retyping every column
listed in \`replacements\` back to it.`
  }

  private get checkConstraintsSection() {
    if (this.checkConstraints.length === 0) {
      return `No check constraint is defined on ${this.table}.${this.column}, so a check constraint is not
what blocked this retype. Read the original database error below.`
    }

    const constraints = this.checkConstraints
      .map(constraint => `  - ${constraint.name}\n      ${constraint.definition}`)
      .join('\n')

    return `Check constraints defined on ${this.table}.${this.column}:

${constraints}`
  }

  private get guidanceSection() {
    if (this.checkConstraints.length === 0) return 'No check constraints to reconcile.'

    return `A check constraint is re-evaluated against the column's new type, so one that references
${this.enumName} blocks the retype. Drop the constraints above before calling dropEnumValue,
then re-add the ones that should survive. dropEnumValue deliberately does not do this for
you: only your migration knows which of these three outcomes each constraint needs.

  1. a constraint that exists only to forbid '${this.value}' should be dropped and never re-added
  2. a constraint that never mentions '${this.value}' should be re-added exactly as it was
  3. a constraint that mentions '${this.value}' alongside other values should be re-added with
     '${this.value}' struck from it

Drop one with:

  await DreamMigrationHelpers.dropConstraint(db, '${this.checkConstraints[0]!.name}', { table: '${this.table}' })`
  }
}
