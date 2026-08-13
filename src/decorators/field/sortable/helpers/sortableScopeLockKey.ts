import Dream from '../../../../Dream.js'
import DreamApp from '../../../../dream-app/index.js'
import canonicalScopeValue from './canonicalScopeValue.js'

const FNV_OFFSET_BASIS = 0xcbf2_9ce4_8422_2325n
const FNV_PRIME = 0x100_0000_01b3n
const UINT64_MASK = 0xffff_ffff_ffff_ffffn
const INT64_SIGN_BIT = 0x8000_0000_0000_0000n
const UINT64_MODULUS = 0x1_0000_0000_0000_0000n

const UTF8 = new TextEncoder()

/**
 * The hash of the part of the key that cannot vary for one sortable field —
 * database, table, position field — so that a path deriving a key per row, per
 * field, per stabilization round only ever serializes and hashes the scope
 * values. Keyed by the serialization of those three, so a `DreamApp` whose
 * database name changes derives a new key rather than reusing a stale one.
 */
const invariantPrefixHashes = new Map<string, bigint>()

/**
 * @internal
 *
 * Derives the advisory lock key that makes one sort scope's position
 * computation exclusive. Every position-mutating path derives it the same way,
 * since two paths that disagree about the key do not exclude each other.
 *
 * The key covers:
 *
 * - the **physical database name**, because Postgres advisory locks are scoped
 *   to the cluster rather than to a database. Without it, two unrelated
 *   databases in one cluster — including this repo's own parallel test
 *   databases — would contend on the same key, and that contention shows up
 *   only as writers of unrelated scopes queueing behind each other.
 * - the table and the position field, since a model can declare several
 *   sortable fields, each with its own position space.
 * - the scope column values, which are what a "sort scope" actually is.
 *
 * Values are encoded structurally rather than joined into a string, so a null
 * member is distinct from an empty string and no combination of delimiters in
 * one member can be mistaken for a different tuple. They are also canonicalized
 * against the column's database type (`canonicalScopeValue`), so a writer
 * holding a pending JavaScript value and a writer holding the value Postgres
 * hydrated derive one key rather than two.
 *
 * **Scope values are assumed non-adversarial.** The hash is FNV-1a, which is
 * unkeyed: anyone who can choose a scope column's value — where that column
 * holds user-supplied text rather than a foreign key — can compute a value
 * whose key equals another scope's, and share that scope's lock with it. A
 * collision costs contention and never correctness, since a shared lock
 * over-serializes rather than under-locking, and the bounded wait
 * (`sortableScopeLockTimeout`) caps what a deliberate one can achieve at
 * stalls rather than at hangs. A keyed digest would make deliberate collisions
 * expensive, and is not used: changing the derivation would give old and new
 * processes different keys for one scope during a rolling deploy, which is the
 * race this lock exists to eliminate.
 *
 * @param dream - the record whose scope is being locked
 * @param positionField - the sortable position column
 * @param scopeValues - `[column, value]` pairs for the scope being locked
 * @returns a 64-bit signed key
 */
export default function sortableScopeLockKey(
  dream: Dream,
  positionField: string,
  scopeValues: [string, unknown][]
): bigint {
  const databaseName = DreamApp.getOrFail().dbName(dream.connectionName || 'default', 'primary')

  const normalizedScopeValues = [...scopeValues]
    .sort(([columnA], [columnB]) => (columnA < columnB ? -1 : columnA > columnB ? 1 : 0))
    .map(([column, value]) => [column, canonicalScopeValue(dream, column, value)])

  // the hashed text is exactly
  // `JSON.stringify([databaseName, table, positionField, normalizedScopeValues])`,
  // hashed in two halves so the invariant half is hashed once per sortable
  // field rather than once per row. FNV-1a is a streaming hash, so resuming
  // from the cached state gives the same key byte for byte
  return toSignedKey(
    fnv1a64(
      JSON.stringify(normalizedScopeValues) + ']',
      invariantPrefixHash(databaseName, dream.table, positionField)
    )
  )
}

function invariantPrefixHash(databaseName: string, table: string, positionField: string): bigint {
  // the serialization of the first three members, with the array's closing
  // bracket replaced by the separator the scope values follow. It is also the
  // memo key: a JSON array of the three members is unambiguous, where any
  // joined form would need a delimiter no member could contain
  const prefix = JSON.stringify([databaseName, table, positionField]).slice(0, -1) + ','

  const cached = invariantPrefixHashes.get(prefix)
  if (cached !== undefined) return cached

  const hash = fnv1a64(prefix, FNV_OFFSET_BASIS)
  invariantPrefixHashes.set(prefix, hash)
  return hash
}

/**
 * 64-bit FNV-1a, resumed from a previously hashed prefix.
 */
function fnv1a64(value: string, hash: bigint): bigint {
  for (const byte of UTF8.encode(value)) {
    hash = ((hash ^ BigInt(byte)) * FNV_PRIME) & UINT64_MASK
  }

  return hash
}

/**
 * Folds the unsigned hash into the signed range Postgres's
 * `pg_advisory_xact_lock(bigint)` accepts.
 */
function toSignedKey(hash: bigint): bigint {
  return hash >= INT64_SIGN_BIT ? hash - UINT64_MODULUS : hash
}
