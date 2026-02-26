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

Syncs OpenAPI changes, types, etc. This is automatically performed by `psy db:migrate` and `psy db:reset`, so it's not necessary to run separately if those are already being run.

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
pnpm uspec
```

### Individual Unit Spec File

```bash
pnpm uspec <filepath>
```

Example:

```bash
pnpm uspec spec/unit/controller/ok.spec.ts
```

### All Unit Specs in a Directory

```bash
pnpm uspec <dirpath>
```

Example:

```bash
pnpm uspec spec/unit/controller/
```

### Individual Spec Example in a Unit Spec File

**Note:** Requires `allowOnly: true,` to be temporarily added to `spec/unit/vite.config.ts`

Add `.only` to a spec example:

```typescript
it.only('renders the data as json', () => {
  // test code
})
```
