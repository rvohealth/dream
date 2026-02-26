# AGENTS.md - AI Agent Instructions

This file provides instructions for AI agents working on this project.

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
