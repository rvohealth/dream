import ops from '../../../src/ops/index.js'

// Values passed to ops.like / ops.ilike are bound as parameters (no SQL
// injection), but `%`, `_`, and `\` are still interpreted as wildcards by
// PostgreSQL at evaluation time. ops.like.escape is the ergonomic helper
// developers reach for when they want literal matching of user input
// embedded in a LIKE pattern. (R-009)

describe('ops.like.escape', () => {
  it('escapes bare percent signs', () => {
    expect(ops.like.escape('100%')).toBe('100\\%')
    expect(ops.like.escape('%admin%')).toBe('\\%admin\\%')
  })

  it('escapes bare underscores', () => {
    expect(ops.like.escape('100_00')).toBe('100\\_00')
    expect(ops.like.escape('_')).toBe('\\_')
  })

  it('escapes bare backslashes', () => {
    expect(ops.like.escape('foo\\bar')).toBe('foo\\\\bar')
  })

  it('escapes a backslash before a wildcard without double-escaping', () => {
    // '\%' arrives already looking like an escape; we must protect the
    // backslash first so the result decodes to the literal string '\%'.
    expect(ops.like.escape('\\%')).toBe('\\\\\\%')
    expect(ops.like.escape('\\_')).toBe('\\\\\\_')
  })

  it('leaves non-metacharacters untouched', () => {
    expect(ops.like.escape('alice@example.com')).toBe('alice@example.com')
    expect(ops.like.escape('')).toBe('')
    expect(ops.like.escape('hello world')).toBe('hello world')
  })

  it('escapes all three metacharacters together', () => {
    expect(ops.like.escape('a%b_c\\d')).toBe('a\\%b\\_c\\\\d')
  })
})
