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
 * new type. `42883 undefined_function` covers both `operator does not exist: text <> my_enum`
 * (the widen) and `function char_length(my_enum) does not exist` (the restore); `42804
 * datatype_mismatch` covers the argument-type variant and
 * `default for column "x" cannot be cast automatically to type my_enum`.
 *
 * A retype can fail for reasons that have nothing to do with a stored expression — most
 * obviously `22P02 invalid input value for enum` when a value written by `replacements` is not
 * a member of the recreated enum. Those codes are deliberately absent, so the constraints found
 * on the column are reported as context rather than as the diagnosis.
 *
 * These codes say *an* expression could not be re-derived. They do not say **which** one, and
 * the message must not pretend otherwise: a check constraint, a partial index's `WHERE`
 * predicate, an expression index and an uncastable column `DEFAULT` all raise them, and
 * `dropEnumValue` reads only the check constraints. Verified against Postgres 18 —
 * `CREATE INDEX i ON t (id) WHERE val <> 'a'` followed by `ALTER TABLE t ALTER COLUMN val TYPE
 * text` raises exactly `42883 operator does not exist: text <> my_enum`, the same code and the
 * same wording a blocking check constraint produces.
 */
const EXPRESSION_RETYPE_SQLSTATES = new Set(['42804', '42883'])

/**
 * Quote every segment of a possibly schema-qualified table name the way Kysely quotes the
 * identifiers it emits, so a `to_regclass` argument resolves exactly the relation the retype
 * targeted. Exported because `DreamMigrationHelpers`' catalog read and the diagnostic query in
 * this message must name the relation identically; it lives here because that helper already
 * imports this module, and the reverse import would be a cycle.
 */
export function quotedRelationName(table: string) {
  return table
    .split('.')
    .map(segment => `"${segment.replace(/"/g, '""')}"`)
    .join('.')
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
 *
 * It never claims a check constraint caused a failure it cannot tie to one. The SQLSTATE gate
 * separates "a stored expression could not be re-derived" from "a bad value" — but it cannot
 * say *which* expression, because an index predicate raises the identical code, so even on the
 * gated path the constraints stay context and the message names the other candidates.
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
   * column could not be re-derived against its new type. A blocking check constraint is one
   * source of that; a partial index predicate, an expression index and an uncastable column
   * default are others. Anything else (a bad value, a missing relation, a permission error) is
   * not evidence that any stored expression was involved.
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
    if (this.originalErrorBlockedAnExpression) {
      return [this.expressionBlockerSection, this.constraintRemedySection].filter(Boolean).join('\n\n')
    }

    if (!this.relationResolved) return 'No check constraints could be read, so none can be reconciled here.'
    if (this.checkConstraints.length === 0) return 'No check constraints to reconcile.'

    return `The database error below is not the "an expression on this column could not be re-derived
against its new type" failure that a blocking check constraint produces, so the constraints
above are listed as context rather than as the diagnosis: they may or may not have anything
to do with this. Read the original database error below first.`
  }

  /**
   * What the SQLSTATE does and does not establish, and every expression that raises it. The
   * candidates are listed rather than diagnosed on purpose: `dropEnumValue` reads the column's
   * check constraints and nothing else, so naming one of them as the cause would be a guess
   * that sends the caller to drop a constraint that changes nothing.
   */
  private get expressionBlockerSection() {
    return `The database error below is the one Postgres raises when an expression stored against
${this.column} could not be re-derived for the column's new type. The retype re-evaluates every
such expression at once, and the error names none of them, so it does not say on its own which
one blocked the retype. It is one of:

  - a check constraint on the column — ${this.checkConstraintCandidateNote}
  - a partial index whose WHERE predicate references the column (not read)
  - an expression index over the column (not read)
  - the column's DEFAULT, when it cannot be cast to the new type (not read, though that variant
    names the column and the word "default" in the error below)

A view, a rule or a generated column that reads ${this.column} blocks the retype with a different
error that names itself ("cannot alter type of a column used by ..."), so none of those is what
happened here.

The indexes are what dropEnumValue cannot see. List them with:

  SELECT indexrelid::regclass AS index, pg_get_indexdef(indexrelid) AS definition
    FROM pg_index WHERE indrelid = to_regclass('${quotedRelationName(this.table)}');`
  }

  private get checkConstraintCandidateNote() {
    if (!this.relationResolved) return 'dropEnumValue could not read these, as noted above'
    if (this.checkConstraints.length === 0) return 'there are none on this column, so this one is ruled out'
    return this.checkConstraints.length === 1 ? 'the one listed above' : 'the ones listed above'
  }

  /**
   * The copy-pasteable remedy, offered only when there is a constraint to drop and phrased as
   * conditional on that constraint actually being the blocker — which this error cannot know.
   */
  private get constraintRemedySection() {
    if (!this.relationResolved || this.checkConstraints.length === 0) return ''

    const dropCalls = this.checkConstraints
      .map(
        constraint =>
          `  await DreamMigrationHelpers.dropConstraint(db, '${constraint.name}', { table: '${this.table}' })`
      )
      .join('\n')

    const them = this.checkConstraints.length === 1 ? 'it' : 'them'

    return `If one of the check constraints above is the blocker, drop ${them} before calling dropEnumValue,
then re-add the ones that should survive. dropEnumValue deliberately does not do this for you:
only your migration knows which of these three outcomes each constraint needs.

  1. a constraint that exists only to forbid '${this.value}' should be dropped and never re-added
  2. a constraint that never mentions '${this.value}' should be re-added exactly as it was
  3. a constraint that mentions '${this.value}' alongside other values should be re-added with
     '${this.value}' struck from it

Drop ${them} with:

${dropCalls}

If dropping ${them} changes nothing, the blocker is one of the other expressions above.`
  }
}
