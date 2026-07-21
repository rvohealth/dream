## 2.20.0

Schema/image skew tolerance for rolling deploys. During a rolling deploy, a migration can finish before containers built against the previous schema have drained; the same window opens in reverse when application code is rolled back after a drop-column migration has already run. Several Dream code paths previously asserted the compiled column list against the live database and failed with `42703 column "…" does not exist` in that window, even when the running code never used the dropped column. This release makes writes and separate-query preloads tolerant of dropped/added-column skew, and adds `ignoredColumns` for making planned column drops fully safe. **Scope**: column drops and additions only — renames, added `NOT NULL` constraints, and type changes remain expand/contract territory that no ORM mechanism fixes; and `leftJoinPreload` retains a documented residual fragility for unplanned drops (see below).

- Saves (`create`/`save`/`update`) now use `RETURNING *` instead of enumerating every compiled column in the `RETURNING` clause, and filter the returned row to the compiled column list before hydrating the instance. A write that never touches a dropped column now succeeds under skew (previously every write against the table failed, because `RETURNING` named the dropped column); a write that explicitly sets a dropped column still fails loudly, since `SET`/`VALUES` continue to name only the attributes actually being written. Database-computed values (sequence ids, column defaults, trigger-set columns) hydrate exactly as before, the returned row is identical in steady state, and a returned column the compiled schema doesn't know about never reaches the instance.
- Non-polymorphic `preload`/`load` now selects the associated row wholesale (`"association_alias".*`) instead of plucking every compiled column of the associated model, filtering to the compiled column list at hydration. A preload whose associated table lost (or gained) a column mid-deploy now succeeds; previously it failed exactly like `leftJoinPreload`. Polymorphic belongsTo preloads and base-model reads were already skew-tolerant and are unchanged.
- Base-model read hydration (`find`, `all`, `first`, etc., which select `*`) now also filters unknown row keys before constructing instances. Previously a row containing a column the compiled schema didn't know about (added-column skew, or an ignored column with a database value) assigned it as a plain instance property — invoking a same-named user-defined setter, or throwing on a getter-only property.
- New `ignoredColumns` model getter, the mechanism for **planned** column drops (the industry-standard two-deploy process, mirroring Rails' `ignored_columns`):

  ```ts
  class User extends ApplicationModel {
    public override get ignoredColumns() {
      return ['legacyEmail'] as const
    }
  }
  ```

  Declaring a column ignored removes it from the generated types files on the next `sync`: it is omitted from both the Kysely `DB` interface and the dream schema, so it disappears from `columns()` and everything that flows from it — preload and `leftJoinPreload` select lists, save hydration, attribute definition, and param safety — and any remaining code reference to the column becomes a type error. The two-deploy process: (1) remove all code using the column, declare it ignored, sync, deploy fully; (2) ship the drop migration, then remove the declaration and resync. Because deploy 1's containers never name the column in any SQL, the drop in deploy 2 is safe for every code path — including `leftJoinPreload` — and a rollback to deploy 1's image remains safe after the drop. The declaration is consumed only while `sync` generates the types files (a declared-but-not-synced model is not yet protected — CI should verify `sync` produces no diff); at runtime an ignored column behaves exactly like a column that does not exist: reads through type escape hatches return `undefined`, and writes assign an inert, never-persisted instance property, matching existing unknown-attribute behavior. `sync` fails loudly when a model attempts to ignore its primary key, an STI model attempts to ignore its `type` column, or models sharing a table declare divergent ignored columns (STI children inherit the base model's declaration, so agreement is automatic unless a child overrides it).

- `leftJoinPreload` residual, documented on the method: it must enumerate every compiled column of every joined model under per-alias names (per-alias `*` is not expressible in one flat row), so an **unplanned** column drop still breaks `leftJoinPreload` queries for the duration of the rollout window. A planned drop via `ignoredColumns` is safe, because the enumeration shrinks a full deploy before the column is dropped. No runtime schema discovery is attempted, following fifteen years of Rails precedent (its join-based `eager_load` has the same property).

## 2.19.0

- All seven through-association options — `and`, `andAny`, `andNot`, `selfAnd`, `selfAndNot`, `order`, and `distinct` — may now be declared on a through association whose source is itself a through association. Previously any of these options on such an association threw `ThroughAssociationConditionsIncompatibleWithThroughAssociationSource`, even on a direct load of the association — so e.g. `@deco.HasMany('Chore', { through: 'polymorphicUser', source: 'chores', and: { name: 'sweep' } })` was rejected outright when `chores` on the intermediate model was itself a through association. The options now compose exactly as they do when the source is a concrete (HasMany/HasOne/BelongsTo) association: the conditions constrain the terminal join, across every load path (`preload`, `load`, `leftJoinPreload`, `innerJoin`, `associationQuery`, etc.) and whether the association is loaded directly or bridged by a further through association. When multiple through associations funnel into the same terminal join and more than one carries `order`/`distinct`, they apply in join order (innermost bridge first), matching how a through association's options already combined with its concrete source's options. Since the condition no longer exists, the `ThroughAssociationConditionsIncompatibleWithThroughAssociationSource` error class and its export are removed.
- Fixed explicitly aliased loads of associations carrying `selfAnd`/`selfAndNot` — e.g. `innerJoin('featuredPost as fp')`, or a through association like `leftJoinPreload('ratingsThroughPostsThatMatchUserTargetRating as r')`. The generated SQL referenced the association's declared name instead of the explicit alias (`"featured_post"."position" = ...` while the join was aliased `posts as "fp"`), so the query failed at execution with a Postgres missing-FROM-clause-entry error. The `selfAnd`/`selfAndNot` condition now references the explicit alias correctly. Unaliased loads, and aliased loads of associations that merely bridge _through_ a `selfAnd`-carrying intermediate (`innerJoin('featuredRatings as fr')`), were unaffected.

- Fixed a type-level hole where traversing an association chain through an alias (`preload('posts as p', ...)`) or through an association on the other side of a polymorphic BelongsTo (`preload('rateable', 'comments', ...)`) silently disabled all validation of subsequent `and`/`andNot`/`andAny` clauses — arbitrary keys and mistyped values (including wrong model instances under association keys) were accepted. These clauses are now validated against the traversed association's table and model exactly as they are for plain traversal.
- Associations on the other side of a polymorphic BelongsTo can now be aliased and chained through in `preload`/`load`: `Rating.preload('rateable', 'comments as c', 'post')` compiles (it already worked at runtime). Aliasing the polymorphic association itself (`preload('rateable as r', 'comments')`) now also resolves the chain correctly, and a final array of association names spanning different polymorphic targets (`preload('tasks', 'taskable', ['cleaningSupplies', 'workoutType'])`) no longer requires an `as any` cast.
- Several association-chain shapes that always fail at runtime are now compile-time errors:
  - Joining a polymorphic BelongsTo association (`innerJoin`/`leftJoin`/`leftJoinPreload`/`leftJoinLoad`), aliased or not, at any position in the chain — this raises `CannotJoinPolymorphicBelongsToError` at runtime. `preload`/`load` are unaffected.
  - Reusing an association name or alias as a namespace within a single join chain (`innerJoin('posts as comments', 'comments')`, or repeating a name mid-chain) — this previously produced a database error from the conflicting SQL aliases.
  - Passing an array of association names anywhere but the final argument (`preload(['posts'], 'compositions')`) — the runtime silently dropped every argument after the array, so nothing after it was ever loaded.
  - Constraining a non-optional BelongsTo mid-chain (`preload('balloonSpotterBalloons', 'balloon', { and: { ... } }, 'balloonLine')`) — extends the existing final-argument rule to constraints at any position, for the same reason (the constraint could null a value the generated OpenAPI spec declares non-nullable).
  - A mid-chain `and` clause after an aliased association with required on-clauses no longer skips the required-key check (the alias previously caused the requirement lookup to silently come back empty).
- `where`, `whereNot`, `whereAny`, query `and`/`andNot`/`andAny`, and join on-clauses (the `and`/`andNot`/`andAny` options on `innerJoin`, `preload`, and `leftJoinPreload`) now accept an array of model instances under a BelongsTo association key, e.g. `Post.where({ user: [user1, user2] })`. For a non-polymorphic association this expands to a foreign-key `IN` over the instances' primary keys (`user_id IN (...)`). For a polymorphic association the instances are grouped by polymorphic type, each group becomes an id-`IN` plus type-match pair, and the groups are OR'd together — `LocalizedText.where({ localizable: [composition, compositionAsset] })` compiles to `(localizable_id IN (...) AND localizable_type = 'Composition') OR (localizable_id IN (...) AND localizable_type = 'CompositionAsset')` — so an id collision across types can never match the wrong record. STI instances group under their STI base class name (a Latex and a Mylar balloon both land in a single `'Balloon'` group), matching how a single STI instance already filters. An empty array matches nothing, consistent with an empty `IN` array on a column, and a negated empty array (`whereNot`/`andNot`) therefore behaves as if the clause were absent. Negating an instance array negates the whole expansion and, like negating a single instance, includes records whose foreign key is null. Arrays remain a compile-time error in `create`/`update`/`findOrCreateBy` params, where a list of parents is meaningless.
- Fixed `whereNot`/`andNot` with a single polymorphic association instance dropping the type condition. `LocalizedText.whereNot({ localizable: composition })` previously negated on the id alone (`NOT(localizable_id = X)`), so it wrongly excluded records pointing at a _different_ polymorphic type that happened to share the same id. The full id-plus-type conjunction is now negated — `NOT(localizable_id = X AND localizable_type = 'Composition')` — so records of other types with a colliding id are correctly included.
- Add grouped aggregates — `countBy`, `minBy`, `maxBy`, `sumBy`, and `avgBy` — that run an aggregate under a SQL `GROUP BY` and return a `Map` keyed by the group value, so you can aggregate per group in one query instead of looping. `countBy(groupColumn)` returns `Map<groupValue, number>` (the per-group row count); `minBy`/`maxBy`/`sumBy`/`avgBy` take a group column plus the column to aggregate, e.g. `Booking.where({ ... }).sumBy('placeId', 'nightlyRateCents')` returns `Map<placeId, number | null>`. Each Map value has the same type and coercion the matching scalar aggregate produces for that column: `countBy` mirrors `count` (always a `number`), while `minBy`/`maxBy`/`sumBy`/`avgBy` mirror `min`/`max`/`sum`/`avg`, so the value is nullable exactly when the aggregated column is (a group whose aggregated values are all `null` produces a `null` value). The Map key is the group column's resolved type and includes `null` only when the group column is nullable — a nullable group column yields a real `null` key rather than silently dropping those rows. Because `GROUP BY` only returns groups that have at least one matching row, a group with no rows produces no entry in the Map; seed your own defaults when reading it (`byPlace.get(placeId) ?? 0`) rather than expecting every key to be present. Existing `where` filters, default scopes (SoftDelete/STI), and joined-association columns all carry through, so you can group by a joined column (`Composition.query().innerJoin('compositionAssets').countBy('compositionAssets.name')`). All five are available statically on the model (`Booking.countBy('placeId')`), on a query (`Booking.where({ ... }).countBy('placeId')`), and inside a transaction (`Booking.txn(txn).countBy('placeId')`).

- Widened the `typescript` peer-dependency range from `^5.9.3` to `>=5.0.0`. The caret range pinned consumers below TypeScript 6, so installing Dream alongside a newer TypeScript (6.x, 7.x, and beyond) produced a peer-dependency conflict even though Dream works fine on them. The range is now floor-only: it still signals that a modern TypeScript (5.0+) is required, but never blocks a TypeScript upgrade.

- A failed `sync` now fails the CLI command. Previously, any error during sync (db introspection, schema building, a throwing `onSync` callback) was logged and the generated files were reverted, but the command still exited 0 — so CI running `psy sync` or `db:migrate` went green while the generated types had just been reverted or left stale. The revert still runs; the error is then rethrown so the command exits nonzero.
- Rejected database-connection destroys during teardown (`closeAllDbConnections` / `closeAllConnectionsForConnectionName`) are now logged at error level with the connection label instead of vanishing silently. Teardown remains best-effort: remaining connections still close, and a subsequent `getConnection()` builds a fresh pool.
- Generated migrations no longer create an index on `deleted_at` columns (reverses the auto-index introduced in 2.17.2). This applies both to the auto-emitted `deleted_at` column on SoftDelete model/resource generation and to explicitly passed `deleted_at` columns. Rationale: the SoftDelete default scope's `WHERE deleted_at IS NULL` matches nearly every row on a healthy table, so the planner rarely chooses a plain b-tree on the column while every soft-delete table pays its size and write amplification on every write; Dream internals never issue a query the index could serve (`undestroy`/`reallyDestroy` go by primary key); and the useful alternatives are dialect-specific SQL a multi-dialect generator must not emit by default. This only affects newly generated migrations — existing apps keep the indexes they already have. If your app does need one, add an index shaped to your own access patterns; on Postgres the two patterns that actually pay off are:

  - a composite partial index on your hot lookup columns with `WHERE deleted_at IS NULL` (e.g. `CREATE INDEX posts_user_id_live ON posts (user_id) WHERE deleted_at IS NULL`), for hot scoped reads;
  - a partial index `WHERE deleted_at IS NOT NULL` (e.g. `CREATE INDEX posts_soft_deleted ON posts (deleted_at) WHERE deleted_at IS NOT NULL`), for purge/GC sweeps over soft-deleted rows.

  Both patterns are Postgres-specific syntax. The STI `type` column auto-index is unchanged.

## 2.18.1

- No runtime changes. This patch release republishes the 2.18.0 package contents through GitHub Actions after 2.18.0 was accidentally published from a local machine.

## 2.18.0

Security fixes:

- Default scopes expressed with `whereNot(...)` or `whereAny(...)` are now applied on association loads (`preload`, `join`, `leftJoinPreload`, `innerJoin`), matching how they already applied to direct queries. Previously only `where(...)` default scopes crossed into the association `join ... on` predicate, so a `@Scope({ default: true })` built with `whereNot`/`whereAny` was silently dropped when the model was loaded through an association — leaking rows the scope was meant to hide. Built-in `SoftDelete`/STI scopes use `where(...)` and were unaffected. **Behavior change:** apps that (intentionally or not) relied on `whereNot`/`whereAny` default scopes not filtering association loads will now see those associations return fewer rows, consistent with direct queries.
- Added a `paginationMaxPageSize` config (default **200**) that caps the effective page size for all three paginators — `paginate`, `cursorPaginate`, and `scrollPaginate`. The requested `pageSize` is now clamped with `Math.min(requested, paginationMaxPageSize)`, closing a denial-of-service amplification where an app forwarding an attacker-controlled `params.pageSize` could force a full-table load. Configure it like the existing default page size: `DreamApp.set('paginationMaxPageSize', 500)` (raise) or a lower value to tighten. **⚠️ Potentially-truncating behavior change:** the new default cap is 200, so any app that currently serves pages larger than 200 (whether via an explicit `pageSize > 200` or a `paginationPageSize` configured above 200) will now be silently clamped to 200 rows per page. If you legitimately return more than 200 rows per page, you MUST raise `paginationMaxPageSize` to your intended ceiling to preserve existing behavior.
- Defense-in-depth: runtime column identifiers passed to `order`, `pluck`, and dynamic `where`/`whereNot`/`whereAny` keys on the base query are now validated against the model's compiled schema before reaching the database. An unknown _plain_ (un-namespaced) column now throws a Dream `InvalidColumnName` error instead of surfacing as a raw Postgres error or a silent blind-`ORDER BY` side-channel — closing a schema-enumeration/error-oracle foot-gun for apps that forward attacker-controlled input as an identifier (e.g. `Model.order(req.query.sort as any)`). This is **not** an injection fix (Kysely already quotes identifiers); it converts an unhandled DB error into a controlled framework error. Only unambiguous plain schema columns are validated. Namespaced/table-aliased/association-namespaced identifiers (anything containing a `.`, e.g. `order('balloon.volume')` or `where({ 'users.email': ... })`), association-name where keys (`where({ user: userInstance })`), `DreamConst.passthrough`/`required` sentinels, and association-defined order/join clauses are deliberately left unvalidated to avoid rejecting any currently-valid input. Passing a valid column is unchanged; only a genuinely non-existent plain column that would already have errored at the database is affected.
- `snakeify`/`camelize` (and the shared `recursiveStringCase` helper they delegate to) now enforce a maximum object-nesting depth of 500. Previously the recursion had no depth guard, so a deeply-nested input — for example an attacker-supplied JSON request body that stays under the size limit but nests thousands of levels deep — exhausted the call stack and surfaced as an uncontrolled `RangeError` (HTTP 500). Such input now throws a controlled, catchable `MaxRecursiveStringCaseDepthExceeded` error before the stack is exhausted. The cap is far above any legitimate nesting depth (request params, serializer output, config objects), so real application data is unaffected.
- Invalid column-encryption keys now fail closed at boot. `DreamApp.init` previously only `console.warn`ed when the `current` column-encryption key was the wrong length, and never checked the `legacy` key at all, so a misconfigured key passed boot and only surfaced later as an uncaught error on the first encrypt/decrypt. Boot now throws `DreamAppInitInvalidEncryptionKey` when the `current` key is invalid, and also validates the `legacy` key (when configured), throwing if it is invalid; the error names which key (`current`/`legacy`) is wrong. Valid keys and an absent `legacy` key pass unchanged. **Behavior change:** an app that was previously only WARNED about an invalid encryption key will now FAIL TO BOOT — this is the intended fail-closed hardening. If your app fails to boot after upgrading, generate a valid key (`pnpm psy g:encryption-key`) for the reported key.
- `DecryptionParseError` no longer carries any decrypted plaintext. When an authenticated GCM decrypt succeeds but the resulting plaintext is not valid JSON, the error previously attached the underlying `SyntaxError` as its `cause`, and that message embeds a snippet of the just-decrypted plaintext (e.g. `Unexpected token ... "secret..." is not valid JSON`). An app that logs `error.cause` would leak that plaintext snippet into its logs. The `cause` is now dropped, so `DecryptionParseError` exposes only its generic, plaintext-free message. This branch is only reachable after a successful authenticated decrypt (not attacker-triggerable); the change is defense-in-depth against log leakage. Malformed-plaintext decrypts still throw `DecryptionParseError` as before.

## 2.17.2

- The `g:sti-child` CLI help now calls out that `belongs_to` is unsupported for STI children, and the generator rejects `belongs_to` columns before writing files. STI child associations must be declared on the parent model. Plain STI child models also no longer include the commented `Decorators` import/`const deco` scaffold, avoiding boilerplate that points developers toward decorators that are incompatible with STI children.
- Generated migrations now create an index on generated `deleted_at` columns. This applies to SoftDelete model/resource generation and to generated migrations that add a `deleted_at` column explicitly, so the default `deleted_at IS NULL` SoftDelete scope has a matching database index.

## 2.17.1

- Test database pool setup now treats missing or invalid `parallelTests` configuration as one worker instead of disabled. This means apps that omit `DREAM_PARALLEL_TESTS`, pass `Number(process.env.DREAM_PARALLEL_TESTS)` when the env var is unset, or explicitly set `parallelTests` to `1` still create the minimum per-live-worker database pool during test DB setup. The per-worker claim path already needed that pool even for sequential Vitest runs, because Vitest can start a new process before the previous one has fully exited; Dream now makes the CLI create/drop path and the runtime claim path agree on the same minimum pool width.

## 2.17.0

- Generated migrations now create auto-incrementing non-uuid primary keys with a modern identity column. `bigint` (and the legacy `bigserial` alias) emit `.addColumn('id', 'bigint', col => col.primaryKey().generatedByDefaultAsIdentity())`, and `integer` emits the `integer` variant — compiling to `"id" bigint generated by default as identity primary key` (and the integer form). This fixes a bug where the `integer` and `bigint` primary-key types generated a bare `NOT NULL` primary key with no default, so a `Model.create()` with no id was rejected by the database. Because the columns are `GENERATED BY DEFAULT AS IDENTITY` (not `ALWAYS`), the database fills the id when none is supplied while an explicit `Model.create({ id })` is still accepted, matching the prior `serial`/`bigserial` behavior. uuid primary keys (`uuid7`, `uuid4`, `uuid`) are unchanged. No runtime/insert-path change in Dream and no schema-type change (`bigserial` and `bigint` both introspect as `int8`, `serial` and `integer` as `int4`); regenerate or hand-edit existing migrations only if you want the new form.
- The advertised set of primary-key types (`primaryKeyTypes`, exported from `@rvoh/dream/system`) is trimmed to the four canonical values `['uuid7', 'uuid4', 'bigint', 'integer']`. `bigserial` is demoted to a legacy alias: it is no longer advertised but remains accepted as a `primaryKeyType` value (typed `LegacyCompatiblePrimaryKeyType`) for backward compatibility, and a `bigserial`-configured app still boots and generates valid (bigint-identity) migrations. `serial` was never a configured value and is not added. The `DreamApp` default `primaryKeyType` changes from `bigserial` to `bigint`; the generated output is identical because both emit a bigint identity column.
- STI children now inherit base association metadata instead of owning copied association metadata maps during boot. Direct `@deco.BelongsTo`, `@deco.HasOne`, and `@deco.HasMany` declarations on STI children are still rejected with `StiChildCannotDefineNewAssociations`, but inherited base associations no longer depend on model import or decorator-initializer order.

## 2.16.0

- STI children now fail boot if they define associations that are not available on the STI base class. This enforces the intended `StiChildCannotDefineNewAssociations` rule during Dream's decorator initialization pass, where field association decorators have actually registered their metadata. Move any `@deco.BelongsTo`, `@deco.HasOne`, or `@deco.HasMany` declarations from STI children to the STI base class.

## 2.15.2

- upgrade to pnpm@11.9.0; add strictDepBuilds: false and deny esbuild build scripts in pnpm-workspace.yaml

## 2.15.1

- switch to Github action publishing to npmjs.com

## 2.15.0

- Required `BelongsTo` association getters now throw `MissingRequiredBelongsToAssociation` when the association has been loaded as `null`. This replaces a confusing null dereference path with a diagnostic error that names the model, association, foreign key, and, for polymorphic associations, the polymorphic type field. Optional `BelongsTo` associations still return `null`, and associations that have not been loaded still throw `NonLoadedAssociation`. When the foreign key is present but the association loads as `null`, the message calls out that the associated record may have been deleted and suggests checking whether the inverse `HasOne`/`HasMany` association should specify `dependent: 'destroy'`.
- Passing an explicit constraint (an `{ and: {...} }` / on-clause object) as a trailing argument to `preload`, `load`, `leftJoinPreload`, or `leftJoinLoad` for a non-optional `BelongsTo` is now a TypeScript compile-time error. A required `BelongsTo` getter is typed non-null, and that non-null type flows through serializers into a non-nullable OpenAPI field; a load-time constraint could filter out the real, existing parent and leave the slot `null`, contradicting that contract. Constraining optional `BelongsTo`, `HasOne`, and `HasMany` associations is unaffected, and `join` is unaffected (it hydrates no slot). This is the compile-time complement to the runtime `MissingRequiredBelongsToAssociation` above: the type error catches an explicit developer-supplied constraint, while the runtime error backstops the cases types cannot reach (a deleted row or an internal scope nulling a required parent). If a parent may legitimately be absent, mark the association `optional: true`.

## 2.14.1

- `DreamParamSafeAttributes` now preserves concrete model-declared types for virtual columns, including `@Encrypted` properties, instead of exposing those param-safe attributes as `any`. Database-backed and association param types continue to use Dream's existing updateable-property typing; only the virtual-column `any` fallback is replaced by the model property type.

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
- Add `DreamMigrationHelpers.encryptColumn` / `decryptColumn` for migrating an existing plaintext column to and from the `@Encrypted` decorator's storage format. `encryptColumn(db, { table, column })` renames `column` to `encrypted_<column>`, widens it to `text`, and rewrites every non-null value as AES-GCM ciphertext using the same code path the decorator's setter uses, so the result decrypts cleanly through the getter. This closes a sharp edge: simply renaming a plaintext column to `encrypted_<column>` and adding `@Encrypted` leaves plaintext in the column, so the getter then throws `DecryptionError` ("authentication tag … invalid") because plaintext is not a valid ciphertext payload — the data has to actually be encrypted, which a column rename alone does not do. `decryptColumn` is the exact inverse (it honors both the `current` and `legacy` keys and takes an optional `columnType` to restore the original column type). Both transform in place inside the migration transaction, leave null values untouched, and throw `MissingColumnEncryptionOpts` when column encryption is unconfigured. They rewrite one row at a time (each value needs a fresh IV computed in Node), reading rows in keyset batches of `batchSize` (default 1000) to bound memory rather than pulling the whole table into scope. They are still unsuited to very large tables; the TSDoc documents that and recommends dropping any index on the column first (indexing ciphertext is pointless and slows the per-row writes). Options: `encryptedColumnName` (defaults to `encrypted_<column>`, matching the decorator), `primaryKey` (defaults to `id`), `batchSize`, and — on `decryptColumn` — `columnType` to restore the original column type.

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
