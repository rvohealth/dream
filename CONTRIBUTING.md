# Contributing to Dream

Dream (`@rvoh/dream`) is the ORM behind the [Psychic web framework](https://psychicframework.com). This guide takes you from a fresh clone to a pull request that passes CI. AI agents also follow [AGENTS.md](AGENTS.md), which carries the same rules in more detail.

## Reporting bugs

- **Do not open a GitHub issue for a security vulnerability.** Follow the [security policy](SECURITY.md) instead.
- **Search the [issues page](https://github.com/rvohealth/dream/issues)** first, since someone may already have reported it.
- **If nobody has, [open a new issue](https://github.com/rvohealth/dream/issues/new)** with:
  - the Dream version
  - the Node version
  - the Postgres version
  - the TypeScript version
  - a description of the problem
  - a code example that reproduces it

## Prerequisites

- **Node.js 26 or Node.js 24.** Node 26 is the primary development, CI and release runtime. Node 24 is supported (`engines.node` is `>=24`), and CI runs the unit specs on both.
- **pnpm 12.14.0.** It is pinned through `packageManager` in `package.json`, so use corepack or a pnpm that switches itself to the pinned version:
  - **Node 26** does not bundle corepack. Run `npm i -g corepack` and then `corepack enable`. Or install a standalone pnpm (`npm i -g pnpm`): when you run it in this repo, it switches itself to 12.14.0.
  - **Node 24.12.0 or later** bundles a corepack that can launch pnpm 12, so `corepack enable` is enough.
  - **Older Node 24 releases** bundle corepack 0.34.4 or earlier, which cannot launch pnpm 12. Every `pnpm` command then fails with `MODULE_NOT_FOUND` for `…/pnpm/12.14.0/bin/pnpm.cjs`. Run `npm i -g corepack@0.34.7` and then `corepack enable`, or use Node 26 or a standalone pnpm.
- **PostgreSQL**, with a role that can create databases. CI runs the specs against Postgres 13, 14, 17 and 18.
- **MySQL 8.** The test app has a `mysql` connection, so `pnpm spec`, `db:create` and `db:migrate` all need a running MySQL server. CI uses `mysql:8.0`.

Unit specs need no other services, and the repo has no feature or browser specs.

## Setup

```sh
git clone https://github.com/rvohealth/dream.git
cd dream
pnpm install
cp .env.test.example .env.test
```

Edit `.env.test`. It is gitignored, and the specs, the console and the `pnpm dream` CLI all read it:

- Set `DB_USER` to your Postgres role. If that role needs a password, add `DB_PASSWORD=...`.
- Run `pnpm dream g:encryption-key` three times, and paste the keys into `APP_ENCRYPTION_KEY`, `LEGACY_APP_ENCRYPTION_KEY` and `COLUMN_ENCRYPTION_KEY`. This works before any database exists.
- The MySQL defaults are user `root`, no password, `localhost:3306`. Adjust the `MYSQL_DB_*` values if your server differs.
- By default, the alternate connection (`ALTERNATE_DB_*`) and the replica (`REPLICA_DB_*`) use the same local Postgres server as the primary.
- `DREAM_PARALLEL_TESTS` sets the number of vitest workers.

Then create and migrate the test databases:

```sh
pnpm dream db:create
pnpm dream db:migrate
```

`pnpm dream` runs the test app's CLI (`test-app/cli`) with `NODE_ENV=test` unless you set it, so these commands act on the databases named in `.env.test`:

- `db:create` creates the primary, alternate and MySQL databases.
- `db:migrate` runs the test app's migrations (`test-app/db/migrations`). It also creates the pool of per-worker test databases (`<name>_2`, `<name>_3`, and so on, sized from `DREAM_PARALLEL_TESTS`), and regenerates `test-app/types` (`sync`).

If you raise `DREAM_PARALLEL_TESTS`, re-run `pnpm dream db:migrate` so the pool grows to match. `pnpm dream db:reset` drops, recreates, migrates and seeds everything.

You do not need a build step before running specs. Vitest runs the TypeScript sources directly.

## Running checks

| Command               | What it does                                                                    | CI job                                                                                                   |
| --------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `pnpm lint`           | ESLint over `src`, `spec` and `test-app`, then `prettier --check` over the repo | Linting (Node 26)                                                                                        |
| `pnpm format`         | Rewrites files with Prettier                                                    | —                                                                                                        |
| `pnpm build`          | Builds the published library (CJS, ESM and types) into `dist`                   | Check build (Node 26)                                                                                    |
| `pnpm build:test-app` | Type-checks `src`, `spec` and `test-app` together                               | Check build (Node 26)                                                                                    |
| `pnpm spec`           | Fails if any migration is pending, then runs the full vitest suite              | Unit tests: Node 24 with Postgres 13 and 14, Node 26 with Postgres 17 and 18, sharded with `--shard=N/2` |

Before you push, run all three of these and make sure each one passes:

```sh
pnpm lint
pnpm build:test-app
pnpm spec
```

- `pnpm lint` must report **zero warnings**, not only zero errors. ESLint warnings do not change the exit code, so read the summary.
- Run the full `pnpm spec`. A targeted run does not replace it, and neither run type-checks: only `pnpm build:test-app` catches type errors.
- `pnpm spec <file-or-directory>` runs part of the suite, for example `pnpm spec spec/unit/helpers/`.
- `NODE_DEBUG=sql pnpm spec` prints every query.
- `pnpm console` opens a REPL with the test app's models loaded.

Spec conventions:

- `context` is a global alias for `describe`, defined in `spec/setup/beforeAll.ts`.
- `it.only` and `describe.only` work locally, because Vitest's `allowOnly` defaults to on outside CI. CI rejects them, so remove them before you push.

CI also runs these checks:

- **Ensure no sync diffs.** CI runs `pnpm dream db:migrate --skip-sync` and then `pnpm dream sync`, and fails if that changes any file. When you change a migration, a model or a serializer, run `pnpm dream db:migrate` (or `pnpm dream sync`) and commit the regenerated `test-app/types` files.
- **Cooldown exclude allowlist.** See the next section.

## Dependency updates and supply-chain policy

[SECURITY.md](SECURITY.md#supply-chain-hardening) explains the reasoning. In practice:

- **The install policy lives in `pnpm-workspace.yaml`**: `minimumReleaseAge: 4320`, a 3-day cooldown on newly published versions, and `minimumReleaseAgeExclude`, which lists only `@rvoh/*`. pnpm 11 and later ignore both settings in `.npmrc`, which holds only the registry pin.
- **CI keeps the cooldown in place.** The "Cooldown exclude allowlist" job asks the pinned pnpm what it will enforce (`pnpm config get minimumReleaseAge` and `minimumReleaseAgeExclude`). It fails if the cooldown is not a positive number, if any exclude is not an `@rvoh/` package, or if `.npmrc` contains a release-age setting. If a version is too new to install, wait out the cooldown rather than excluding it. For an urgent third-party patch, SECURITY.md calls for a transient override that is reverted afterwards.
- **`allowBuilds` in `pnpm-workspace.yaml` is the allowlist** of dependencies that may run install scripts. Keep it minimal.
- **`overrides` in `pnpm-workspace.yaml` currently holds one entry (`esbuild`).** A comment next to it explains why no parent upgrade fixes the advisory. Resolve advisories by upgrading the package that brings the dependency in, wherever that works.
- **Change `package.json` and `pnpm-lock.yaml` together.** CI installs with `pnpm install --frozen-lockfile`.
- **Peer dependency ranges** (`kysely`, `commander`, `pg` and the others in `peerDependencies`) are part of Dream's contract with Psychic and with apps. Changing one is user-facing, so it needs a version bump and a changelog entry.

## Changes and pull requests

- **Branch from an up-to-date `main`.** Pull requests are merged through the GitHub UI, so an old local branch may already be merged.
- **Open a [pull request](https://github.com/rvohealth/dream/pulls)** whose description states the problem and the solution, and links the issue if there is one. CODEOWNERS requests review from the maintainers.
- **Changelog and version.** Every user-facing change needs a version bump in `package.json` and an entry under a new `## X.Y.Z` heading at the top of `CHANGELOG.md`:
  - A change is user-facing if a consumer of the npm package can observe it, including the TSDoc on a public API.
  - Purely internal changes (refactors, test-only changes, internal comments) get no changelog entry and no version bump.
  - A pull request bumps exactly one version component. If the scope grows, bump the higher component and reset the ones below it to zero.
- **Public errors.** Export an error only when an application developer needs to throw it or catch it as part of a normal workflow.
- **No Postgres-only code in shared paths.** Put adapter-specific behavior behind the query-driver seam. AGENTS.md has the details.

## Releases

Maintainers cut releases as [RELEASING.md](RELEASING.md) describes:

1. Merge the version bump and changelog entry to `main`.
2. Publish a GitHub release tagged `vX.Y.Z`, matching `package.json`.
3. The Release workflow (`.github/workflows/release.yml`) checks that the tag matches the version, builds the package and runs `npm publish` through npm trusted publishing. The `prepack` script also regenerates the typedoc output in `docs/` (`pnpm dream build:docs`), which is gitignored.

Thanks for contributing!

The Dream team
