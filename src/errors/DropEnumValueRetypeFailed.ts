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
  /**
   * Whether the pre-flight catalog read resolved `table` to a real relation. When it did
   * not, `checkConstraints` being empty means "not read", not "none defined", and the
   * message says so instead of asserting a negative it cannot support.
   */
  relationResolved: boolean
  checkConstraints: DropEnumValueCheckConstraint[]
  originalError: Error
}

/**
 * SQLSTATEs Postgres raises when it cannot re-derive a stored expression against a column's
 * new type — the failure mode a check constraint on the column produces. `42883
 * undefined_function` covers both `operator does not exist: text <> my_enum` (the widen) and
 * `function char_length(my_enum) does not exist` (the restore); `42804 datatype_mismatch`
 * covers the argument-type variant.
 *
 * A retype can fail for reasons that have nothing to do with a constraint — most obviously
 * `22P02 invalid input value for enum` when a value written by `replacements` is not a member
 * of the recreated enum. Those codes are deliberately absent, so the constraints found on the
 * column are reported as context rather than as the diagnosis.
 */
const EXPRESSION_RETYPE_SQLSTATES = new Set(['42804', '42883'])

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
 *
 * It never claims a check constraint caused a failure it cannot tie to one: the
 * constraint-removal guidance is gated on the original error's SQLSTATE, and the
 * constraints found on the column are otherwise presented as context.
 */
export default class DropEnumValueRetypeFailed extends Error {
  public readonly enumName: string
  public readonly value: string
  public readonly table: string
  public readonly column: string
  public readonly retypeDirection: 'toText' | 'toEnum'
  public readonly relationResolved: boolean
  public readonly checkConstraints: DropEnumValueCheckConstraint[]
  public readonly originalError: Error

  constructor({
    enumName,
    value,
    table,
    column,
    retypeDirection,
    relationResolved,
    checkConstraints,
    originalError,
  }: DropEnumValueRetypeFailedOpts) {
    super(undefined, { cause: originalError })
    this.enumName = enumName
    this.value = value
    this.table = table
    this.column = column
    this.retypeDirection = retypeDirection
    this.relationResolved = relationResolved
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

  /**
   * True when the original error is one Postgres raises because a stored expression on the
   * column could not be re-derived against its new type. That is what a blocking check
   * constraint looks like; anything else (a bad value, a missing relation, a permission
   * error) is not evidence that a constraint was involved.
   */
  private get originalErrorBlockedAnExpression() {
    const code = (this.originalError as { code?: unknown }).code
    return typeof code === 'string' && EXPRESSION_RETYPE_SQLSTATES.has(code)
  }

  private get checkConstraintsSection() {
    if (!this.relationResolved) {
      return `The check constraints on ${this.table}.${this.column} could not be read: ${this.table} did not
resolve to a table when dropEnumValue looked it up, so whether a check constraint blocked
this retype is unknown. Read the original database error below.`
    }

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
    if (!this.relationResolved) return 'No check constraints could be read, so none can be reconciled here.'
    if (this.checkConstraints.length === 0) return 'No check constraints to reconcile.'

    if (!this.originalErrorBlockedAnExpression) {
      return `The database error below is not the "an expression on this column could not be re-derived
against its new type" failure that a blocking check constraint produces, so the constraints
above are listed as context rather than as the diagnosis: they may or may not have anything
to do with this. Read the original database error below first.`
    }

    const dropCalls = this.checkConstraints
      .map(
        constraint =>
          `  await DreamMigrationHelpers.dropConstraint(db, '${constraint.name}', { table: '${this.table}' })`
      )
      .join('\n')

    return `A check constraint is re-evaluated against the column's new type, so one whose expression
cannot be re-derived for that type — typically one that references ${this.enumName} — blocks the
retype. Drop the constraints above before calling dropEnumValue, then re-add the ones that
should survive. dropEnumValue deliberately does not do this for you: only your migration
knows which of these three outcomes each constraint needs.

  1. a constraint that exists only to forbid '${this.value}' should be dropped and never re-added
  2. a constraint that never mentions '${this.value}' should be re-added exactly as it was
  3. a constraint that mentions '${this.value}' alongside other values should be re-added with
     '${this.value}' struck from it

Drop ${this.checkConstraints.length === 1 ? 'it' : 'them'} with:

${dropCalls}`
  }
}
