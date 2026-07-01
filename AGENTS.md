# AGENTS.md - AI Agent Instructions

This file provides instructions for AI agents working on this project.

## Starting New Work

Before starting any new work, switch to `main` and pull the latest, unless the
user explicitly instructs otherwise:

```bash
git switch main && git pull
```

We merge pull requests through the GitHub UI, so the local working branch is
often already merged into `origin/main`. Starting from a stale, already-merged
branch is the default failure mode this rule prevents.

## MANDATORY: Completion Gauntlet Before Push / PR

Before pushing a branch, opening a pull request, or otherwise declaring work
complete, you MUST run the full completion gauntlet and confirm every command
exits successfully. No exceptions — a previous agent opened a PR with a
TypeScript build error because they skipped this. Do not let that happen
again.

Run all three, in this order, and verify each one passes:

```bash
pnpm lint
pnpm build:test-app
pnpm spec
```

Rules:

- **Never** push or open a PR if any of the three fail. Fix the failure first.
- **Zero lint warnings.** `pnpm lint` must exit clean — no errors _and_ no
  warnings. ESLint warnings (e.g. unused `eslint-disable` directives) do not
  fail the command's exit code on their own, so read the output: if the summary
  reports any warnings, the gauntlet has NOT passed. Most are auto-fixable by
  re-running the lint command with `--fix` added to the `eslint` invocation,
  followed by `pnpm format`. A PR must never introduce a new lint warning.
- **Never** trust a previous run — re-run the gauntlet after every change you
  make in response to a failure, including formatter/lint auto-fixes.
- `pnpm spec` (full suite) is required. Targeted `pnpm spec <path>` runs skip
  the TypeScript compilation step and will miss type errors that
  `pnpm build:test-app` catches — they are not a substitute.
- This applies even to "trivial" changes (doc tweaks, comment changes,
  version bumps). Trivial changes have broken the build before.
- If a command takes a long time, wait for it. Do not assume it would have
  passed.

## Changelog and Versioning

Every **user-facing** change needs a version bump and a corresponding
`CHANGELOG.md` entry. A change is user-facing if a consumer of the published
package can observe it: runtime behavior, public/exported API or types,
generated output, error messages, deprecations, or peer-dependency
requirements.

The changelog is written for consumers of the package, so it must **not**
document fully internal changes — refactors, renames of unexported symbols,
internal type-annotation cleanups, comment/doc edits, test-only changes, and
anything else with no observable effect on a consumer. These still ship, but
they get neither a changelog entry nor (on their own) a version bump.

When in doubt, ask: "could someone who only installs the npm package tell this
happened?" If no, keep it out of the changelog.

## Database Adapters: No Postgres-Only Code in Shared Paths

Dream is moving toward real multi-database support, so framework code in shared
paths MUST NOT hardcode Postgres-only behavior (`pg.Client`, `pg`-specific SQL
like `pg_try_advisory_lock`, Postgres type OIDs, etc.). Adapter-specific
database work goes through the **query-driver seam**: an overridable method on
`QueryDriverBase` with a no-op or fail-loud default, implemented per driver
(`PostgresQueryDriver`, the test-app `MysqlQueryDriver`), while the shared
orchestration stays driver-neutral and speaks only adapter-agnostic terms.

This is exactly how `setDatabaseTypeParsers`, `duplicateDatabase`, and the
per-worker test-database claim (`supportsParallelTestDatabases` +
`openTestDatabaseLockSession`, orchestrated by `src/db/testDatabasePool.ts`)
work. When a shared path needs the database to do something adapter-specific:

- Add an overridable static to `QueryDriverBase` with a safe default — either a
  no-op or a `throw` that names what to implement (so a non-supporting adapter
  fails loud, never silently falling through to a Postgres connection).
- Implement it in `PostgresQueryDriver` and, where it proves the abstraction,
  in the test-app `MysqlQueryDriver`.
- Keep the shared caller free of any driver import or driver-specific type;
  dispatch via `DreamApp.dbConnectionQueryDriverClass(connectionName)`.

If you find yourself importing `pg` (or any one engine's client) into a shared
module, that is the signal to move the primitive onto the seam instead.

## Database Commands

### Migrate the Database

```bash
pnpm dream db:migrate
```

### Reset the Database

Drop, create, and migrate the database:

```bash
pnpm dream db:reset
```

### Sync

Syncs types, etc. This is automatically performed by `pnpm dream db:migrate` and `pnpm dream db:reset`, so it's not necessary to run separately if those are already being run.

## Build and Code Quality

### Build

Find TypeScript errors:

```bash
pnpm build:test-app
```

### Format Code

```bash
pnpm format
```

### Lint Code

```bash
pnpm lint
```

## Running Unit Specs

### All Unit Specs

```bash
pnpm spec
```

### Individual Unit Spec File

```bash
pnpm spec <filepath>
```

Example:

```bash
pnpm spec spec/unit/helpers/compact.spec.ts
```

### All Unit Specs in a Directory

```bash
pnpm spec <dirpath>
```

Example:

```bash
pnpm spec spec/unit/helpers/
```

### Individual Spec Example in a Unit Spec File

**Note:** Requires `allowOnly: true,` to be temporarily added to `spec/unit/vite.config.ts`

Add `.only` to a spec example:

```typescript
it.only('removes undefined and null values', () => {
  // test code
})
```
