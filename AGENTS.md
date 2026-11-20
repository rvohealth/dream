# AGENTS.md - AI Agent Instructions

## Node.js support

Dream supports Node.js 24 and newer. Use Node.js 26 as the primary development,
CI, build, and release runtime. Keep runtime compatibility checks on Node.js 24;
the development `@types/node` version does not set the minimum supported
runtime.

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

## Decide From Project Standards Instead of Asking

When this file or another documented project rule answers a question, decide
the question from that rule and state in one line which rule you applied; do
not put it to a person. Ask only when nothing written answers it, or when the
answer conflicts with an explicit instruction. Existing code is evidence, not a
standard by itself: a practice becomes a standard when the code follows it
consistently for a reason you can state. When you decide from a standard that
is followed but not written down, write it into this file, with its reason, in
the same change, so the answer travels with the project.

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
generated output, error messages, deprecations, peer-dependency requirements,
or the documentation on a public API.

The changelog is written for consumers of the package, so it must **not**
document fully internal changes — refactors, renames of unexported symbols,
internal type-annotation cleanups, internal comment edits, test-only changes,
and anything else with no observable effect on a consumer. These still ship,
but they get neither a changelog entry nor (on their own) a version bump.

**Documentation on a public API is user-facing.** TSDoc on an exported symbol
or a `public` member ships in the emitted `.d.ts` and is what a consumer reads
at the call site, so correcting it — a documented option the method does not
accept, a described behavior the method does not have — needs a changelog
entry and a version bump, exactly like any other consumer-observable fix. Only
comments a consumer never sees fall under the exclusion above.

When in doubt, ask: "could someone who only installs the npm package tell this
happened?" If no, keep it out of the changelog.

### One Version Component Per PR

A pull request bumps **exactly one** version component. Never stack two bumps in
the same PR — no major _and_ minor, no minor _and_ patch.

If a PR's scope grows while you work on it, so that the bump you already made is
no longer the right level, do not add a second bump on top of it. Bump the
higher component and reset every component below it to zero:

- Started at `2.20.0`, bumped the patch to `2.20.1`, then the work grew into a
  feature: the release is `2.21.0`, not `2.21.1`.
- Started at `2.20.0`, bumped the minor to `2.21.0`, then the work turned into a
  breaking change: the release is `3.0.0`, not `3.1.0`. Refusing an invalid
  declaration is not a breaking change in this sense; see the next section.

Stacked bumps produce confusing release jumps (a single PR appearing to skip a
version) and misrepresent the release's level to consumers.

### Refusing an Invalid Declaration Is a Minor Release

Refusing a declaration Dream treats as invalid, at compile time or at boot (see
Invalid Declarations: Refused by Types and at Boot), is a minor release, even
when code that compiled or booted on the previous version now fails. The
`CHANGELOG.md` entry calls out each such new failure, saying what now fails and
what to declare instead.

The reason: the declaration was already invalid and could only misbehave later,
at a request, a save or a sync, so refusing it surfaces an existing bug rather
than changing supported behavior. Dream has shipped such refusals as minors
since 2.36.0.

## Public Error Exports

Export an error only when a developer of a Psychic application needs to throw
it or should reasonably be able to catch it as part of an expected,
well-functioning application workflow. An error being useful for debugging,
logging, or framework internals does not by itself justify a public export.
Compatibility-only residue (an error kept exported only for backward
compatibility, not because new code should throw or catch it) must be
documented as such, not treated as proof it still belongs in the public API.

## Invalid Declarations: Refused by Types and at Boot

Refuse an invalid declaration (a model decorator, an association, a validation,
a serializer attribute) in both of these places:

- **In TypeScript**, wherever the types can express the rule.
- **At boot, with a runtime check in the package that owns the declaration.**
  In Dream that is class decoration (when the model file is imported) or the
  decorator-initialization pass `DreamApp.init` runs when it loads the models.
  Psychic checks its own declarations in `PsychicApp.init`. An invalid
  declaration must never surface first at sync, at a request or at a save.

A refusal that reads the generated schema (`types/db.ts`, `types/dream.ts`)
belongs in `DreamApp#validateApplicationModels`, the integrity pass that
`DreamApp.init` skips under `bypassDreamIntegrityChecks`, not in a decorator or
its initializer. `sync`, `db:migrate` and `g:migration` boot with that bypass
because the schema they boot against may not yet have a column a migration
adds or changes: regenerating it is their job, and a refusal that reads it at
model load would stop them from doing it.

Both halves are needed. Types leak: `as any`, wide-typed values, `as const`
constants and plain JavaScript all get past them. And a boot failure is caught
by every spec run and every deploy, while a failure on first use is found by a
user.

The error is not exported (see Public Error Exports), and its message names the
class, the declaration, and what to declare instead.

Rely on the types alone only when a declaration that slips past them is
harmless or fails closed, for example an unknown name that is ignored so that
nothing extra is accepted.

## Serializers: Declarations Never Depend on Data or Passthrough Data

A serializer function must declare the same keys, names and associations whatever
data and passthrough data it is called with. Dream and Psychic call it with neither
to register it, preload for it and build its OpenAPI schema. Read either only inside
a `customAttribute` callback, or hand passthrough data on to a child serializer. Never
write a spec, test-app serializer or TSDoc example that shapes a declaration from either.

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

## CI Tooling: Industry Standards Only

Use the standard, documented mechanism a tool already provides (for example pnpm's `minimumReleaseAge` for dependency cooldowns). Never hand-write CI scripts, guards or harnesses that re-verify a tool's own configuration; the tool enforcing its configuration is the check. If a protection needs enforcing against config edits, use code review, CODEOWNERS or branch protection on the config files, not a custom check. An agent that thinks a custom CI check is needed must stop and ask the owner, naming the standard it could not find.

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

Add `.only` to a spec example. Vitest allows it locally (`allowOnly` defaults to
`!process.env.CI`) but CI rejects it, so remove it before pushing:

```typescript
it.only('removes undefined and null values', () => {
  // test code
})
```
