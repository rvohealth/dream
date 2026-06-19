## 2.14.0

- Eliminate the intermittent parallel-test database collision by claiming each live test worker its own database from a pre-created pool via a process-lifetime lock the database driver supplies through the query-driver seam, replacing the `<base>_<VITEST_POOL_ID>` naming. Under vitest (`pool: 'forks'`, `isolate: true`) `VITEST_POOL_ID` is a _reusable_ slot id (1..maxWorkers) that vitest frees and reassigns across worker processes without awaiting `runner.stop()`, so a retired-but-still-terminating worker overlaps the new worker that reused its slot. Keying the test database off that slot meant the two overlapping processes shared one database and the newcomer's `beforeEach(truncate)` wiped the other's in-flight rows — a record created in a test's setup would vanish before the request under test ran, producing intermittent 404s / empty lists / wrong results (~1 run in 3, and it reproduced serially too because vitest respawns a process per file even with one worker). The fix ties database ownership to _process liveness_ instead of vitest's slot accounting:
  - On first need, a worker claims a free pool database by probing the default connection driver's lock session — a dedicated, long-lived connection that holds a non-blocking lock over the pool indexes for the worker's whole lifetime. The lock auto-releases the instant that connection drops on process exit, so a reused slot can never collide — a new worker only ever reuses an index whose previous owner has genuinely exited.
  - The pool is `<base>` (index 1, unsuffixed — no longer a special "pool 1 shares the base DB" case) plus `<base>_2 .. <base>_K`, pre-created at `db:migrate` / `db:reset` time as `TEMPLATE <base>` clones. Pool size is `K = 2 × max(1, parallelTests) + 2`, covering N active workers plus up to N still-terminating ones. This is active in the test-under-vitest path **regardless of `parallelTests`** (the collision reproduces serially), so a plain single-worker run also gets an isolated pool.
  - On genuine pool exhaustion (every index claimed and none freed within a short wait-for-free window) Dream throws a loud, actionable error naming the exact `<packageManager> psy db:reset` command to recreate the pool, rather than hanging or silently sharing a database.
  - The lock primitive is the database driver's concern, dispatched through the query-driver seam (`QueryDriverBase.supportsParallelTestDatabases` + `openTestDatabaseLockSession`, parallel to the existing `duplicateDatabase` / `setDatabaseTypeParsers` overrides), so the pool orchestrator carries no Postgres-specific code. The Postgres driver implements it with the two-`int4` form `pg_try_advisory_lock(key1, key2)`, whose lock space is distinct from the single-`bigint` form application code typically uses, so a claim can never clash with an app-level advisory lock; `key1` folds a hash of the base database name into a fixed Dream namespace so two apps sharing one Postgres cluster reserve disjoint index ranges. A driver that does not implement the seam (`supportsParallelTestDatabases` left `false`) fails loud under vitest with an actionable error rather than silently sharing one database — so a non-Postgres adapter never falls through to a Postgres connection.
  - New driver seam on `QueryDriverBase`: `supportsParallelTestDatabases` (default `false`) and `openTestDatabaseLockSession(connectionName)` returning a `TestDatabaseLockSession` (`{ tryAcquire(namespace, index), release() }`), letting a custom adapter opt into per-worker test databases by mapping the semantic `(namespace, index)` pair to its own lock primitive. The bundled MySQL example driver implements it via `GET_LOCK`.
  - New public API on `DreamApp`: `testDatabaseName(connectionName, connection)` (async — the single source of truth for the claimed name, also used by `@rvoh/dream-spec-helpers`' `truncate`), `ensureTestDatabaseClaimed()`, the `runtimeNeedsTestDatabaseClaim` getter (the runtime needs a claim), and the `testDatabaseClaimEnabled` getter (need _and_ driver support). **Breaking:** the `parallelDatabasesEnabled` getter is removed (it encoded the old `VITEST_POOL_ID > 1` model); it was effectively internal and had no external consumers. Dev/prod connection resolution is unchanged — the claim path is gated on test env under vitest, and the CLI db tasks (which do not run under vitest) keep operating on the whole pool by name.
  - Pairs with `@rvoh/dream-spec-helpers@2.2.0`, whose `truncate` now reads the claimed database name via `testDatabaseName` instead of recomputing it from `VITEST_POOL_ID`.
- Add first-class `ClockTime` and `ClockTimeTz` support to the temporal helper surface that already handled `DateTime`/`CalendarDate`: `range()` now carries explicit ClockTime/ClockTimeTz-compatible bound types, and the Dream REPL preload now exposes `ClockTime` and `ClockTimeTz` alongside `DateTime` and `CalendarDate`.

## 2.13.1

- Internal clarity pass over the Kysely join machinery (`recursivelyJoin` and its helper chain). No behavior change: rewrote three inaccurate `explicitAlias` doc blocks (they claimed the alias is `null` for implicit aliasing, but `recursivelyJoin` passes the association name; it is only `undefined` for the intermediate join tables synthesized while bridging a `through` association — and a copy-paste error listed `'ho'` twice instead of `'ho'`/`'wd'`), extracted the duplicated join-table-expression logic into a documented helper, and fixed stale `where`/`selfWhere` naming left over from the `where` → `and` migration (the real association fields are `and`/`andNot`/`selfAnd`/`selfAndNot`) in the `associationMetadataMap()` doc comment and in through/simple association spec descriptions.
- Dev-dependency security updates (Dependabot / `pnpm audit`, all dev-only — the published package is unaffected). Bumped `vitest` to `^4.1.0` (clears GHSA-5xrq-8626-4rwp, the Vitest UI arbitrary-file-read/execute advisory) and added `vite ^7.3.5` as a direct devDependency to pin Vitest's `vite` peer to a patched line — a `pnpm.overrides` entry does not clamp an auto-installed peer, so the direct devDependency is required. The only `pnpm-workspace.yaml` override required is `esbuild >=0.28.1` (GHSA-gv7w-rqvm-qjhr, high-severity binary-integrity RCE, and GHSA-g7r4-m6w7-qqqr, dev-server file read — both patched only at `0.28.1`): `vite 7` pins `esbuild ^0.27` and `tsx` pins `~0.25`, so neither parent resolves to a patched version on its own, and the clean alternative (vite 8, which drops esbuild for rolldown) is a major migration. The remaining transitive offenders (`postcss`, `js-yaml`, `markdown-it`, `yaml`, `picomatch`, `brace-expansion`, `diff`) resolve to patched versions via their parents' caret ranges with no override needed. `pnpm audit` is clean.
- Fix `range()` rejecting `0`/`0n`/`''` as a bound. The `Range` constructor's empty-range guard was `if (!begin && !end)`, which is truthy for falsy-but-valid bounds, so open-ended ranges over numeric/bigint columns such as `range(0)` (everything `>= 0`) or `range(null, 0)` (everything `<= 0`) threw `Must pass either begin or end to a range` even though the query layer supports single-bound ranges. It now compares against `null`/`undefined` explicitly (`begin == null && end == null`), so only a genuinely empty range is rejected. `DateTime`/`CalendarDate`/`ClockTime` bounds are objects and were always truthy, so their behavior is unchanged.

## 2.13.0

- `DateTime#valueOf()` now UTC-normalizes before stringifying (`this.toUTC().toISO()`) instead of returning the instance's local-zone ISO string. JavaScript routes the relational operators (`<`, `>`, `<=`, `>=`) and primitive coercion through `valueOf`, so comparing two `DateTime`s previously did a lexicographic **wall-clock** compare rather than an instant compare. Same-zone values happened to sort chronologically, so it looked correct — but two values in **different zones** compared by wall-clock text, which silently disagrees with the true instant (e.g. `'12:00Z' < '12:00-05:00'` is true by instant but the old `valueOf` ordered them by the identical-looking local text). Normalizing every value to UTC with fixed-width 6-digit fractional seconds makes lexical order equal chronological order across zones. `valueOf` stays a **string**, so there is no `Number.MAX_SAFE_INTEGER` ceiling and no precision loss. Silent behavior changes to be aware of:
  - **Coercion against a primitive reflects UTC, not local.** `dt + ''` and `Number(dt)` (which coerce via `valueOf`) now yield the UTC representation. `` `${dt}` ``, `String(dt)`, `dt.toString()`, and `dt.toJSON()` are **unchanged** — they call `toISO`/`toJSON` directly and still render the instance's local zone. (DB writes are unaffected: the write path serializes via explicit `.toSQL()`, which already UTC-normalizes, never via implicit `valueOf` coercion.)
  - **Operator-based comparison is now instant-based.** `a < b` / `a > b` / `a <= b` / `a >= b`, `sort()`/`sortBy()`, and `DateTime.min`/`DateTime.max` now order by the underlying instant across zones. `Dream#equals` (and the `toEqualDateTime` test matcher, which delegates to it) likewise becomes instant-and-microsecond equality — matching its documented contract, which the old local-string comparison violated for cross-zone values. Note that loose `==` between **two `DateTime` objects** remains JavaScript reference equality (object-to-object `==` does not consult `valueOf`); use `.equals()`, or `a <= b && a >= b`, for instant equality. `b - a` via the operator is still `NaN` — use `.diff()` / `.toMillis()`.
  - **Documented limit:** lexical ordering equals chronological ordering only for years **0001–9999**. BC/negative years and years ≥ 10000 sort incorrectly because ISO's `-`/`+` year prefixes break lexical order. Accepted as a documented limit rather than encoded around.

## 2.12.1

- Fix `@Encrypted` columns silently failing to round-trip under Deno. `encryptAESGCM`/`decryptAESGCM` built their output with the incremental string-output-encoding cipher path (`cipher.update(data, 'utf8', 'base64') + cipher.final('base64')`, and the inverse on decrypt). base64 encodes in 3-byte groups, so base64-encoding the `update` and `final` chunks separately and concatenating the strings is not equivalent to encoding the whole byte stream when the split lands mid-group. Node tolerates this; Deno's `node:crypto` drops the trailing partial group (e.g. a 10-byte ciphertext came back as 9 bytes), so the truncated ciphertext failed the AES-GCM authentication tag and `User.create({ phone })`-style writes to `@Encrypted` columns threw `Failed to decrypt` at runtime — a Deno-only failure (Node and Bun were unaffected, which is why it escaped earlier testing). Both functions now decrypt/encrypt to a complete `Buffer` and convert base64/utf8 exactly once. The wire format is unchanged and the output is byte-identical to the previous Node output, so values encrypted by earlier versions still decrypt. The string-concatenation path also risked corrupting multibyte UTF-8 plaintext split across the update/final boundary; the Buffer path fixes that too. (Upstream Deno bug: denoland/deno#30806 addressed part of this base64 path but it still reproduces on Deno 2.8.2; the Buffer-based implementation is correct on every runtime regardless.)

## 2.12.0

- Allow `'bun'` and `'deno'` as package managers. `set('packageManager', 'bun' | 'deno')` is now accepted; `DreamApp` init previously rejected anything outside `pnpm`/`yarn`/`npm` via `DreamAppAllowedPackageManagersEnumValues` and threw `DreamAppInitMissingPackageManager` at boot. This lets `@rvoh/create-psychic` scaffold Bun- and Deno-targeted apps, and pairs with `@rvoh/psychic`'s package-manager-aware command construction (`deno task` / `bun run` / `bunx` / `deno run -A npm:`).
- Bump the `dotenv` dependency from `^16.4.5` to `^17.2.3`, matching `@rvoh/psychic-workers`, `@rvoh/psychic-websockets`, and the spec-helper packages. The previously-disjoint ranges made Deno — which keys npm package identity on the full transitive dependency closure — resolve two copies of `@rvoh/dream` that differed only by `dotenv` major version. An app's models then extended one copy's `Dream` while the model importer came from the other, breaking the class-identity check that exempts abstract base models (e.g. `ApplicationBackgroundedModel`) and failing app boot with a spurious "missing required table override". pnpm/npm/yarn hoist a single `dotenv` and were unaffected.

## 2.11.4

- `Query#update` now accepts virtual and `@Encrypted` columns. It was typed `DreamTableSchema` (real columns only), which rejected them even though the default (non-`skipHooks`) path delegates to instance `update`, which handles them. It is now a pair of overloads: real columns may be combined with `skipHooks`; the virtual-aware overload omits `skipHooks`. Passing a virtual or encrypted-property column together with `skipHooks` — which would reach raw SQL and fail — is now a compile-time error, while a raw `encrypted<Name>` column may still be updated with `skipHooks` for manual-encryption / bulk-correction cases.
- `DreamInstanceTransactionBuilder#updateAssociation` (`user.txn(txn).updateAssociation(...)`) now accepts virtual and `@Encrypted` columns on the associated model, matching the non-transaction `Dream#updateAssociation`. It was typed `Partial<DreamAttributes>` (real columns only).
- The find-key argument (first argument) of `findOrCreateBy`, `createOrFindBy`, `updateOrCreateBy`, and `createOrUpdateBy` no longer accepts virtual or `@Encrypted` columns. That argument builds the lookup query, and virtual columns are not real columns while encrypted columns store non-deterministic ciphertext — neither can be queried by. Create-only virtual/encrypted attributes belong in the `createWith` / `with` option, which remains virtual-aware.

## 2.11.3

- Export `DreamDbConfig` from the public package entry point so downstream packages can use it in type annotations (e.g. `conf/dream.ts` in `@rvoh/create-psychic`-scaffolded apps).

## 2.11.2

- `closeAllDbConnections()` / `closeAllConnectionsForConnectionName()` no longer hang shutdown indefinitely. Each Kysely `conn.destroy()` resolves to `pg`'s `pool.end()`, which only settles once every checked-out client is released. A client leased by a query still in flight when shutdown began (an aborted HTTP request during a SIGTERM drain, a feature-spec whose browser page is torn down mid-request) is never released, so `pool.end()` blocked forever and took the whole shutdown with it — a never-completing SIGTERM drain in production, or a feature-spec `afterAll` that hangs for the full hook timeout. The per-connection drain is now bounded by a 10s timeout; on timeout the drain is abandoned (the OS reaps the socket on process exit), the connection is removed from the registry so a later `getConnection()` builds a fresh pool, and a `warn` is logged so the leak stays observable. The happy path (drain completes before the timeout) is unchanged.
- Opt-in connection-leak diagnostics: run with `NODE_DEBUG=dream` (same `node:util` debug-channel convention as `NODE_DEBUG=psychic`) and, when the close timeout above fires, Dream logs the acquire stack of every pg client still checked out — turning "a pooled client was held past shutdown" into the exact call site that leaked it. Off by default and a complete no-op unless the channel is enabled (it patches `pg.Pool.prototype.connect` process-wide, so it is never installed otherwise).
- **Pool `error` listener (crash fix).** Dream's stock query driver constructed `new pg.Pool(...)` with no `error` listener, and neither Kysely's `PostgresDriver` nor Dream attached one. node-postgres explicitly warns that a Pool which emits `error` with no listener takes down the Node process — and idle pooled clients emit `error` on Postgres restart/failover or when a load balancer reaps idle TCP. So a routine DB blip could crash a production process. Dream now attaches an `error` listener that logs via the configured logger and lets the pool discard the dead client and recover. (Custom `dialectProvider` overrides should attach their own — documented on `DreamDbConfig`.)
- **`DreamDbConfig` now exposes a `pg?` key** for pg pool/client options passed straight through to `new pg.Pool(...)`. The stock driver previously hardcoded the `pg.Pool` object, making all of these unreachable. node-postgres ships unprotective defaults (`connectionTimeoutMillis: 0` = wait forever on an exhausted pool; no `statement_timeout`/`query_timeout`/`idle_in_transaction_session_timeout`; empty `application_name` so connections are anonymous in `pg_stat_activity`) — the _prevention_ gap behind the shutdown hang above. The `pg` key is typed as `Omit<pg.PoolConfig, …>` (Dream-managed fields, `connectionString`, `min`, and programmatic fields excluded), so pg's own types carry the per-field documentation and new pg options are available without a Dream release. **Backward compatible:** unset ⇒ pg applies its own defaults; nothing is defaulted at the library layer (a non-zero default changes behavior for every existing app; `statement_timeout`-class defaults kill long migrations/reports — set those on the Postgres role). **`connectionString` is intentionally excluded**: `pg`'s `ConnectionParameters` re-parses the URL and lets its `database`/`host`/`ssl` take precedence over the explicit fields, bypassing Dream's per-connection database name and TLS directive (hard invariants) — parse a `DATABASE_URL` into the discrete `host`/`port`/`user`/`password`/`name`/`ssl` fields instead. `min` is likewise excluded (node-pg's `pg-pool` ignores it — silent no-op). `@rvoh/create-psychic` ships recommended values (`connectionTimeoutMillis`, `application_name`, `keepAlive`) under the `pg:` key in the scaffolded `conf/dream.ts` for new apps.

## 2.11.1

- export DecryptionError, DecryptionParseError, and DecryptionRotationError classes so they can be rescued downstream

## 2.11.0

- improvements to `g:model`, `g:sti-child`, `g:migration`, and the factory generator
- export DecryptionError, DecryptionParseError, and DecryptionRotationError classes so they can be rescued downstream

## 2.10.0

Tightens the `ssl` pass-through field introduced in 2.9.0 (R-027) so its safety doesn't depend on the developer remembering to set it. Lesson-2 fix from the `SECURITY_LEARNINGS_2026-05-12` retrospective.

- `DreamDbConfig.ssl` narrowed from `boolean | tls.ConnectionOptions` to `tls.ConnectionOptions | false`. `true` is no longer accepted — callers choose between `{ rejectUnauthorized: true }` (verified TLS) and `{ rejectUnauthorized: false }` (unverified) rather than picking an ambiguous shorthand. `false` is preserved as the explicit TLS-off sentinel.
- `app.set('db', ...)` now throws `MissingDbSslDirective` at setter time when both `ssl` and `useSsl` are unset on a credential. Throws in every environment, not just production, so the safety question is a deliberate decision at the call site rather than a silent default. Mirrors the Phase 3 weak-key boot throw.
- `useSsl` remains `@deprecated`; `ssl` wins when both are set. `useSsl: true` continues to resolve to `{ rejectUnauthorized: false }` for back-compat.
- `resolvePostgresSsl` return type narrowed to `TlsConnectionOptions | false` to match.

Migration: any app currently calling `app.set('db', { primary: { ..., ssl: true } })` should switch to `ssl: { rejectUnauthorized: true }`. Any app currently relying on the silent TLS-off default (no `ssl` and no `useSsl`) must now set `ssl: false` explicitly.

## 2.9.2

- update uniq helper to not compare functions using toString

## 2.9.1

- fix migration generator emitting an unprefixed `.dropColumn(...)` in the down migration for `:encrypted` attributes; the up creates `encrypted_<name>` so the down failed on rollback. Only affected `alterTable` migrations (the `createTable` path's `dropTable` masked the bug)

## 2.9.0

Security and hardening release. One behavior change worth flagging on upgrade: `Encrypt.decrypt` now throws on failure instead of returning `null` (callers branching on `=== null` should switch to catching the new typed errors).

- `Encrypt.decrypt` throws typed errors (`DecryptionError`, `DecryptionParseError`, `DecryptionRotationError`) instead of returning `null`; key rotation failures throw rather than swallow
- harden `DreamCLI.spawn`: always argv-form (no shell-form invocation), accepts argv via `opts.args`; route DB-types sync, doc generation, and post-sync through it to avoid shell injection; throws `SspawnRequiresDevelopmentOrTest` outside `NODE_ENV=development`/`test`, failing closed for staging-style and unforeseen environments. Backward compatible — a multi-token `command` string like `'pnpm psy sync'` is split on whitespace and prepended to any caller-supplied `opts.args` so existing call sites keep working without changes. The internal `sspawn` helper has been folded into `DreamCLI.spawn`
- add `ops.like.escape` for safely escaping user input in `LIKE` / `ILIKE` clauses
- gate auto-generated type/schema sync to `NODE_ENV=test`; `db:migrate`, `db:rollback`, and `sync` no longer regenerate type files in development, preventing a stale dev database from clobbering types generated under tests
- pass through pg `ssl` config on `DreamDbConfig`
- support `optional` and `required` uniformly on serializer `delegatedAttribute`
- clarify `g:sti-child` help text re: migrations and soft delete
- document the encryption key rotation workflow using `Encrypt.generateKey`
- rewrite `SECURITY.md` with reporting flow, SLA, scope, and disclosure policy
- add security spec suite under `spec/unit/security/`

## 2.8.1

- fix typing of class decorators (`SoftDelete`, `STI`, and `ReplicaSafe`)

## 2.8.0

- non-optional boolean column migration generated by the sti-child generator are generated with the `col => col.notNull().defaultTo(false)` standard used when generating non-sti-child models

## 2.7.1

- admin and internal STI serializers extend STI base admin and internal serializers, not the non-admin/internal serializers

## 2.7.0

- fix `DreamMigrationHelpers.renameTable` for UUID primary keys
- update `DreamMigrationHelpers.renameTable` to rename the primary key index
- don't double-append `_enum` if the enum name already ends with it
- models automatically generated as `@SoftDelete()` unless `--no-soft-delete` flag included
- allow ops with raw expression in where clauses. This already worked, but did not cooperate with types.
- add ops.jsonb method, which is a shorthand for, i.e. `ops.expression('@>', sql\`${{ howyadoin: '123' }}::jsonb\`)`

## 2.6.0

- generate the full load tree and use `.load(...).execute(...)` to avoid exponential N+1 problem during deletion cascades
- types now allow `optional` option for DreamSerializer `delegatedAttribute` (used by Psychic to customize OpenAPI shape of automatically inferred fields to allow `null`)
- fix `rendersOne`, `rendersMany`, and `delegatedAttribute` within a generic serializer so their types work without providing generic type arguments

## 2.5.8

- fix tsdocs for `Query#update`
- missing option tsdocs for Serializers
- remove unsupported optional second argument to `@STI` decorator

## 2.5.7

- fix regression in similarity builder from 2.5.6 patch, caused when passing null values to and or andNot expressions

## 2.5.6

- bump kysely to close critical vulnerabilities, raise peerDependency to latest

## 2.5.5

- add missing `skipHooks` support for `createOrFindBy` and `findOrCreateBy`
- fix Sortable bug when model lacks `updatedAt`
- fix dirty after reload
- fix bug in similarity builder causing recursive associations to incur a max callstack exceeded error

## 2.5.4

- improve CLI descriptions

## 2.5.3

- CLI fixes (incorrect description, missing defaults, broken flag)
- patch vulnerable packages

## 2.5.2

- fix `precision` option on `DreamSerializer#attribute` failing to type-check when the serializer uses a generic type parameter (e.g. STI serializer pattern `<T extends MyModel>`). The conditional type that restricted `precision` to decimal/numeric columns deferred evaluation on generics, making it unassignable. Changed to unconditional `RoundingPrecision`
- fix the types available to OpenAPI for fields decorated with `@deco.Encrypted()` so that they properly determine nullability from the underlying database field

## 2.5.1

- add type support for nested associations stemming from a polymorphic preload chain

## 2.5.0

- add `generate:encryption-key`/`g:encryption-key` CLI command

## 2.4.0

- `includeInternalSerializers` model generator option
- `--internal-serializers` flag for the model and sti-child generators
- fix handling of `encrypted` type for CLI generator commands

## 2.3.3

- fix `rendersOne/Many` `serializer` option to allow ObjectSerializer in addition to DreamSerializer
- logger prints 'null' for null and 'undefined' for undefined

## 2.3.2

- cache `preloadFor` resolution of association tree to preload
- `--table-name` option for the `g:model` generator
- `--model-name` and `--admin-serializers` options for the `g:model` and `g:sti-child` generators
- fix return type of `compact` on an object with values that are unions that include null and/or undefined

## 2.3.1

- fix `pluck` when long association names + long column names exceed 63 bytes (in which case, Postgres silently truncates, and trying to access the property on returned object returns undefined); follows the same strategy already employed by `preload`

## 2.3.0

Apologies that we're introducing breaking changes, but we found it necessary and worth it to support microseconds and took the opportunity to add a ClockTime class and standardize APIs between DateTime, CalendarDate, and ClockTime.

- BREAKING CHANGE: DateTime is now a custom class, not a simple export of Luxon (it still uses Luxon under the hood for most date operations, e.g., timezones and date math)
  - For any features your application relied on that are not supported by DateTime, a Luxon DateTime can be extracted from a DateTime instance by calling `toLuxon` (add `@types/luxon` to your dev dependencies if you do so)
- DateTime now supports microseconds, so you won't lose the microsecond precision provided by Postgres (Luxon does not support microseconds, so the Luxon DateTime returned by `toLuxon` not include microseconds)
- ClockTime introduced to represent the time portion of a DateTime and support time and timetz columns in PostgreSQL
- BREAKING CHANGE: Constructor of CalendarDate updated to match the pattern used for ClockTime
- BREAKING CHANGE: CalendarDate#diff returns an object instead of a number (matching what DateTime returns)

## 2.2.4

- fix windows path issues causing migration runners to fail on windows machines
- make dream development environment friendly to windows devs

## 2.2.3

- apply Dream attribute accessors at load time
- stop explicitly adding keys for each column for Dream instances that haven't yet been persisted to the database (unnecessary and just wastes effort)

## 2.2.2

- patch type system to restrict ambiguous options to rendersOne and rendersMany
- add ability to filter out extraneous tables when syncing with kysely-codegen

## 2.2.1

- move packageManager check to dream application, provide a low-level ENV bypass so that create-psychic can bypass the package manager check when auditioning new package managers without needing to publish new versions of dream.

## 2.2.0

- fix `scrollPaginate` when ordering by non-primary key
- `scrollPaginate` is a deprecated (prefer `cursorPaginate`)
- default `paginate` and `cursorPaginate` sort is reverse primary key since (for keys that represent creation order) in most domains, more recent is more relevant, so should be shown first

## 2.1.4

- model factory for uuid fields should `import { randomUUID } from 'node:crypto'` and set the value to `randomUUID()`
- generators support UUIDv7

## 2.1.3

- add avg and sum methods

## 2.1.2

- add missing peerDependencies

## 2.1.1

generators support alternate casings when parsing association statements (i.e. `psy g model Pet user:belongsTo`)

## 2.1.0

- Change type file generation to AST
- Soft-deprecate DBClass (automatically updated on sync)

## 2.0.4

improve CLI command descriptions

## 2.0.3

don't require database to exist when creating migrations (fixes create-psychic with uuid primary keys)

## 2.0.2

bump glob to close dependabot alerts

## 2.0.1

remove dream-spec-helpers from peer dependencies

## 2.0.0

- namespace package exports
- remove `Benchmark`
- Remove `leftJoinPreloadFor` and `leftJoinLoadFor`. They were never a good idea since the idea of `preloadFor` is that one doesn't need to pay attention to all the things that need to be preloaded, but in a join situation, this is a recipe for disaster since loading tables in parallel results in a Cartesian product of result rows being

## 1.13.0

- generated code uses absolute imports
- `Virtual` decorator requires OpenAPI shape
- don't let a null value in a `Sortable` column break future sorts (null may enter via a migration or `skipHooks`)
- simplify and DRY up Sortable
- Sortable keeps values within the range 1 to N
- fix STI child generation with array attributes (arrays can always be initialized to an empty array, so can leverage a regular non-null constraint). E.g:

  ```
  pnpm psy g:sti-child Room/Bedroom extends Room bed_types:enum\[\]:bed_types:twin,bunk,queen,king,cot,sofabed
  ```

## 1.12.0

- DateTime and CalendarDate are always valid and throw an error if invalid

## 1.11.0

- fix `scrollPaginate` when the column being ordered by is not unique
- fix `pluck` so it properly omits soft-deleted records

## 1.11.0

- `association` and `associationOrFail` handle required and passthrough `and` clauses
- `association` and `associationOrFail` compatible with transactions
- `scrollPaginate` Query and static Dream methods
- remove `paginate` from DreamClassTransactionBuilder

## 1.10.0

- bump kysely
- paginate includes default ordering on id
- cli command to ensure migrations have been run prior to running specs
- fix ability to sync when type files don't reflect models
- leverage Map instead of an object so don't need to prefix numeric keys with underscore to prevent them from being sorted by numeric value rather than by the order in which they were added to the map
- renameTable migration helper
- the key function passed to `sortBy` may now also return a DateTime, a CalendarDate, or a bigint
- fix `sort` on bigint arrays
- `percent` function
- `association` and `associationOrFail` methods to encapsulate the loaded check or associationQuery ternary pattern
- generated association name and id for a `belongs_to` association are based on the final part of the model name, not the entire namespace [requires Psychic update for generated resource controllers/specs to generate valid code]
- [BREAKING] `on` replaces `foreignKey` in association declarations, e.g.:

  ```
    @deco.HasOne('BalloonLine', { on: 'balloonId' })
    public balloonLine: BalloonLine
  ```

- generated migrations include index on foreign key
- don't require openapi for delegatedType when delegating to an association since we can derive the openapi type automatically [requires Psychic update for proper OpenAPI shape to be generated]
- fix OpenAPI in generated STI base serializer

## 1.9.4

- if `required: false`, leave the property undefined rather than rendering as `null`

## 1.9.3

- serializer builder attribute option types allow `required: false`; this will be used by Psychic to omit attributes from the required array in OpenaAPI

## 1.9.2

- allow null for ops argument to a where clause on a datetime or date column

## 1.9.1

- fix where clause range types to allow mixing of CalendarDate and DateTime between start and end of range
- DateTime and CalendarDate may be used in ops when comparing against a date or datetime column

## 1.9.0

Fix broken param safe type columns so that:

1. polymorphic type fields are excluded from param safe types
2. association names are excluded

Bumping minor, since it could introduce breaking changes for those reliant on previous param safe behavior.

## 1.8.0

- throw ColumnOverflow when saving too long a string / number to a database column
- make all of these errors extend the same error so Psychic can check a single error type when deciding to return 400

## 1.7.3

- remove unnecessary token, now that we are open-sourced

## 1.7.2

- fix issue causing generators to generate invalid uuid primary keys

## 1.7.1

- fix error when file without default export exists in the models directory hierarchy

## 1.7.0

- Remove `Dream#isDreamInstance` and `DreamSerializerBuilder/ObjectSerializerBuilder#isSerializer`
- Export `MissingSerializersDefinition`

## 1.6.0

- Move sanitization to Psychic so it can sanitize to real unicode representations

## 1.5.2

- Don't require `openapi` for virtual attributes
- Fix Sortable with null value in scope column
- Enable sanitization of serialized attributes
- Enable `<association>.<column>: null` where statements even when the column can't be null so that queries can be constructed to locate models that don't have a particular association

## 1.5.1

Add `DreamMigrationHelpers.newTransaction()` to support explicitly starting a new transaction within a migration.

## 1.5.0

- add support for multiple database connections in a single dream application. To take advantage of this new feature, you can do the following:

1. Add a new connection configuration to your conf/dream.ts file, providing it an explicit alternate connection name as the second argument, like so:

```ts
dreamApp.set('db', 'myAlternateConnection', {
  primary: {
    user: AppEnv.string('DB_USER'),
    password: AppEnv.string('DB_PASSWORD', { optional: !AppEnv.isProduction }),
    host: AppEnv.string('DB_HOST', { optional: true }),
    name: AppEnv.string('ALTERNATE_DB_NAME', { optional: true }),
    port: AppEnv.integer('ALTERNATE_DB_PORT', { optional: true }),
    useSsl: false,
  },
})
```

Be sure to add any new environment variables to your .env and .env.test files.

2. Run sync

```sh
pnpm psy sync
```

3. add a new application model for your new connection, naming it the name of your connection, pascalized, with the string `ApplicationModel` at the end, like so:

```ts
// app/models/MyAlternateConnectionApplicationModel.ts

import Dream from '../../../src/Dream.js'
import { DBClass } from '../../types/db.alternateConnection.js'
import { connectionTypeConfig, schema } from '../../types/dream.alternateConnection.js'
import { globalTypeConfig } from '../../types/dream.globals.js'

export default class MyAlternateConnectionApplicationModel extends Dream {
  declare public DB: DBClass

  public override get connectionName() {
    return 'alternateConnection' as const
  }

  public override get schema(): any {
    return schema
  }

  public override get connectionTypeConfig() {
    return connectionTypeConfig
  }

  public override get globalTypeConfig() {
    return globalTypeConfig
  }
}
```

4. Now you can proceed to generate a model for your new connection, like so:

```sh
pnpm psy g:model MyNewModel someField:text --connection-name=myAlternateConnection
```

Dream will automatically read the connectionName and use it to derive the `MyAlternateConnectionApplicationModel` automatically, though if this isn't correct, you will need to manually adjust it.

5. Alternate db engine support

If you would like to use an alternate db engine, this is also now supported. To do this, you will need to provide a query driver class that extends one of our base query driver classes. As an example, I recommend you take a look at the `MysqlQueryDriver.ts` file housed within the test-app folder of this repo. This class is not ready for production use, but is a good jumping off point for those interested in supporting a different query driver for dream.

To utilize this feature, simply provide a different query driver class in your db connection config, like so:

```ts
// conf/dream.ts

  app.set('db', {
    queryDriverClass: MyCustomQueryDriverClass,
    ...
  })
```

## 1.4.2

- add ability to set custom import extension, which will be used when generating new files for your application

## 1.4.1

- cache Dream app earlier in the initialization sequence

## 1.4.0

- fix `preloadFor` infinite loop when serializers have circular references

- generated STI base serializer updated to only include the single type of the particular STI child in the OpenAPI shape for that child

- change `primaryKeyValue` from a getter to a method so it can return the correct type even when `primaryKey` has been overridden on a particular Dream model

- remove `IdType`, an unnecessary abstraction that caused type inconsistencies

- explicitly handle bigint from the database as string

## 1.3.3

- make `referenceTypeString` public

## 1.3.2

- restore aliasing in preload/load queries

## 1.3.1

- throw NotNullViolation when Postgres throws a not null violation

- throw CheckViolation when Postgres throws a check violation

## 1.3.0

- sti-child generator includes check constraint instead of not-null since the column should only be not-null for that STI child (or modified by hand to accommodate more than one STI child)

- add `Dream#hasAssociation`

- fix preloading associations on other side of a polyorphic belongs-to association so that we don't set an association on a dream model that doesn't define that association

- fix preloading association on the other side of a polymorphic belongs-to since the same association name may be defined differently on different models. For example, taskable may be a Chore or a Workout, both of which have an `images` association, but `images` goes through ChoreImage on Chore and through WorkoutImage on Workout

- fix preloadFor when a rendersOne/Many renders a polymorphic belongs-to (was only preloading serializer associations for one of the polymorphically associated models)

- fix preloadFor when an explicit serializer option is provided to a rendersOne/Many

## 1.2.1

- Throw DataTypeColumnTypeMismatch when Postgres throws an error attempting to save to a column with a value that can't be cast to the column type.

## 1.2.0

- Add Dream.lookup, enabling devs to tap into the IOC provided by dream to dodge circular import issues

## 1.1.2

- CliFileWriter does not raise error if the file we are writing is not in the file system yet.

## 1.1.1

- Add fs.writeFile options as third argument to CliFileWriter.write, enabling psychic to provide custom flags when writing openapi.json files.

## 1.1.0

- Remove support for preloadThroughColumns. They were broken, fixing them would be overly complex, and the same effect can be obtained using flatten on a serializer rendersOne

## 1.0.6

- Fix joining after a through a polymorphic BelongsTo
  association.

- Improve join implementation

- Disable leftJoinPreload preloadThroughColumns since it doesn't actually work on through associations that resolve to a source that doesn't match the association name (and we were unnecessarily including columns in the leftJoinPreload statement even when there was no `preloadThroughColumns`, thereby bloating the queries unnecessarily)

## 1.0.5

- Support HasOne/Many through polymorphic BelongsTo (trick is that it uses the associated model from the HasOne/Many to limit the BelongsTo to a single associated class / table)

- Fix HasOne/Many through source type

- sync process is now fail-safe, leveraging a utility which caches old copies of files before writing to them. If an exception is thrown at any point during the process, dream will revert all files written using the new `CliFileWriter` class

## 1.0.4

- properly exclude type from `DreamParamSafeColumnNames`

## 1.0.3

- exclude type from `DreamParamSafeColumnNames`

## 1.0.2

- stop computing foreign keys in schema builder when building schema for through associations

## 1.0.1

- [bug] fix preloading STI model via polymporhic association (polymorphic type was being altered to the STI child rather than left as the STI base)
