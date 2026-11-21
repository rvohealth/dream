/**
 * Defines `Symbol.metadata` when the runtime lacks it (Node 24 and 26 do),
 * leaving a definition the runtime or the app already has untouched.
 *
 * TypeScript's emitted decorator code gives decorators a `context.metadata`
 * object only when `Symbol.metadata` exists, and Dream's load-time refusals of
 * invalid STI child declarations (a new association, `@deco.JSON`,
 * `@deco.Sortable`) read that object. Without this, they would fire under
 * esbuild (vitest, tsx), which always creates the object, and silently not
 * fire in an app compiled with `tsc`. This is the polyfill TypeScript 5.2's
 * release notes give for decorator metadata. `Symbol.for('Symbol.metadata')`
 * is the key esbuild's emitted code falls back to, so code compiled by either
 * tool agrees on it.
 *
 * `Decorators` and `STI()`, which write and read that object, import this
 * module first, so it is applied before any app model class using them
 * evaluates.
 */
export default function polyfillSymbolMetadata(): void {
  ;(Symbol as unknown as { metadata?: symbol }).metadata ??= Symbol.for('Symbol.metadata')
}

polyfillSymbolMetadata()
