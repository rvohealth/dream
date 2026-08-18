import Dream from '../../../../Dream.js'
import cachedTypeForAttribute from '../../../../helpers/db/cachedTypeForAttribute.js'

const UTF8 = new TextEncoder()

/**
 * @internal
 *
 * The canonical text form of one sort-scope value — the thing an advisory lock
 * key and a resort group identity are actually built from.
 *
 * Two writers of the same physical sort scope have to derive the same key, and
 * they do not always hold the value in the same JavaScript shape. A save that
 * has not been written yet holds the *pending* value the caller supplied
 * (`'1.00'`, an uppercase UUID, an object whose keys are in source order),
 * while a snapshot read, a create's post-INSERT read and `resort`'s table read
 * hold the value Postgres *hydrated* (`1`, a lowercase UUID, an object whose
 * keys are in jsonb's own order). Postgres considers those pairs one value;
 * `typeof`-only normalization considers them two, and two keys do not exclude
 * each other.
 *
 * So canonicalization is keyed on the column's runtime `dbType`, and the
 * canonical form of each type is **the form the hydrated value already takes**.
 * That anchoring is what makes this safe to ship without a migration or a
 * coordinated deploy: no key derived from a database-hydrated value moves, and
 * the pending-side keys that do move are exactly the ones that disagree with
 * every hydrated-path writer of the same scope today.
 *
 * The classes handled, and what the hydrated value looks like:
 *
 * - `uuid` — Postgres renders UUIDs lowercase, so the canonical form is
 *   lowercase.
 * - `numeric` / `real` / `double precision` — hydrated through
 *   `parsePostgresDecimal`, i.e. `parseFloat`, so `'1.00'` and `1` both
 *   canonicalize to `'1'`.
 * - `jsonb` — hydrated by `JSON.parse` of jsonb's own output, whose object keys
 *   are ordered by key length and then bytewise. Objects are re-emitted in that
 *   order, recursively, so property insertion order stops mattering.
 * - `boolean` — hydrated as a JavaScript boolean; Postgres's own input literals
 *   (`'t'`, `'yes'`, `'0'`, …) canonicalize to `'true'`/`'false'`.
 * - `date` and the four timestamp/time types — hydrated as `CalendarDate`,
 *   `DateTime`, `ClockTime` or `ClockTimeTz`, whose JSON form is the quoted ISO
 *   string. Strings are quoted the same way so a pending `'2026-02-07'` and a
 *   hydrated `CalendarDate` agree.
 *
 * Everything else — `bigint` and `character varying`, which is to say the
 * foreign keys and text columns nearly every sort scope is made of — is left on
 * the untyped normalization below, unchanged.
 *
 * Two residuals are known and accepted rather than fixed:
 *
 * - **`citext`**: Postgres stores the case a row was written with while
 *   comparing case-insensitively, so two rows of one physical scope hydrate to
 *   values that differ in case and split the key on their own. Lowercasing
 *   would fix the split but would *move* hydrated keys, which is the one thing
 *   this design refuses to do.
 * - **Temporal values that agree on the instant but not on the text**: a zone
 *   offset or a fractional-second precision that differs from the hydrated
 *   rendering still yields a different key. Only the string-vs-object quoting
 *   mismatch is canonicalized.
 *
 * Both are over-serialization or a missed exclusion between two *pending*-side
 * writers, never a corrupt position under a key two writers do share.
 *
 * @param dream - the record whose scope column is being canonicalized
 * @param column - the physical database column
 * @param value - the pending or hydrated value held for that column
 * @returns the canonical text form, or `null` for an absent value
 */
export default function canonicalScopeValue(dream: Dream, column: string, value: unknown): string | null {
  if (value === null || value === undefined) return null

  switch (cachedTypeForAttribute(dream.constructor as typeof Dream, column as never)) {
    case 'uuid':
      return canonicalUuid(value)

    case 'numeric':
    case 'real':
    case 'double precision':
      return canonicalNumeric(value)

    case 'jsonb':
      return canonicalJsonb(value)

    case 'boolean':
      return canonicalBoolean(value)

    case 'date':
    case 'timestamp without time zone':
    case 'timestamp with time zone':
    case 'time without time zone':
    case 'time with time zone':
      return canonicalTemporal(value)

    default:
      return untypedScopeValue(value)
  }
}

/**
 * @internal
 *
 * The type-blind fallback, and the shape every unrecognized `dbType` keeps:
 * the same foreign key can arrive as a string or a number depending on the path
 * that loaded it, so values are rendered as text and null is kept distinct from
 * every string, including the empty one.
 */
export function untypedScopeValue(value: unknown): string | null {
  if (value === null || value === undefined) return null

  switch (typeof value) {
    case 'string':
      return value

    case 'number':
    case 'bigint':
    case 'boolean':
      return value.toString()

    default:
      return JSON.stringify(value) ?? null
  }
}

function canonicalUuid(value: unknown): string | null {
  return typeof value === 'string' ? value.toLowerCase() : untypedScopeValue(value)
}

function canonicalNumeric(value: unknown): string | null {
  const parsed = typeof value === 'number' ? value : parseFloat(String(value))
  return Number.isFinite(parsed) ? String(parsed) : untypedScopeValue(value)
}

/**
 * @internal
 *
 * Postgres's own boolean input literals, lower-cased and trimmed, which a
 * pending value may hold while the hydrated value is a JavaScript boolean.
 * Exported so the spec drives its cases from the sets themselves rather than
 * from a hand-copied list that can silently drift out of step with them.
 */
export const BOOLEAN_TRUE_LITERALS: ReadonlySet<string> = new Set(['t', 'true', 'y', 'yes', 'on', '1'])
export const BOOLEAN_FALSE_LITERALS: ReadonlySet<string> = new Set(['f', 'false', 'n', 'no', 'off', '0'])

function canonicalBoolean(value: unknown): string | null {
  if (typeof value === 'boolean') return value ? 'true' : 'false'

  if (typeof value === 'string') {
    const literal = value.trim().toLowerCase()
    if (BOOLEAN_TRUE_LITERALS.has(literal)) return 'true'
    if (BOOLEAN_FALSE_LITERALS.has(literal)) return 'false'
  }

  return untypedScopeValue(value)
}

/**
 * Temporal columns hydrate as `CalendarDate`/`DateTime`/`ClockTime` instances
 * whose `toJSON` is the ISO string, so JSON-encoding both shapes puts a pending
 * ISO string and its hydrated counterpart on the same quoted text.
 */
function canonicalTemporal(value: unknown): string | null {
  return JSON.stringify(value) ?? null
}

/**
 * jsonb neither stores nor renders property insertion order: it orders object
 * keys by length and then bytewise, and a hydrated value therefore always
 * arrives in that order. Re-emitting in the same order makes a pending object
 * literal agree with it, and leaves every hydrated value byte-identical.
 */
function canonicalJsonb(value: unknown): string | null {
  const parsed = typeof value === 'string' ? parseJson(value) : value
  return JSON.stringify(inJsonbKeyOrder(parsed)) ?? null
}

function parseJson(value: string): unknown {
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

function inJsonbKeyOrder(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(inJsonbKeyOrder)
  if (value === null || typeof value !== 'object') return value

  return Object.keys(value as Record<string, unknown>)
    .sort(compareJsonbKeys)
    .reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = inJsonbKeyOrder((value as Record<string, unknown>)[key])
      return acc
    }, {})
}

/**
 * jsonb's own key collation: shorter keys first, ties broken by comparing the
 * UTF-8 bytes.
 */
function compareJsonbKeys(a: string, b: string): number {
  const bytesA = UTF8.encode(a)
  const bytesB = UTF8.encode(b)

  if (bytesA.length !== bytesB.length) return bytesA.length - bytesB.length

  for (let i = 0; i < bytesA.length; i++) {
    if (bytesA[i] !== bytesB[i]) return bytesA[i]! - bytesB[i]!
  }

  return 0
}
