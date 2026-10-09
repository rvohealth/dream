import tableMatchesPattern from '../../../../src/helpers/cli/tableMatchesPattern.js'

describe('tableMatchesPattern', () => {
  const users = { schema: 'public', name: 'users' }

  it('matches a pattern without a dot against the table name alone', () => {
    expect(tableMatchesPattern(users, 'use*')).toBe(true)
    expect(tableMatchesPattern(users, 'public*')).toBe(false)
  })

  it('matches a pattern with a dot against <schema>.<name>', () => {
    expect(tableMatchesPattern(users, 'public.*')).toBe(true)
    expect(tableMatchesPattern({ schema: 'other', name: 'users' }, 'public.*')).toBe(false)
  })

  it('ignores case', () => {
    expect(tableMatchesPattern(users, 'PUBLIC.Users')).toBe(true)
  })

  it('reads extglobs and braces', () => {
    expect(tableMatchesPattern(users, 'public.+(users|posts)')).toBe(true)
    expect(tableMatchesPattern(users, '{posts,users}')).toBe(true)
    expect(tableMatchesPattern(users, '!(public).*')).toBe(false)
  })

  it('negates a pattern with a leading !', () => {
    expect(tableMatchesPattern(users, '!chalupas*')).toBe(true)
    expect(tableMatchesPattern({ schema: 'public', name: 'chalupas_menu' }, '!chalupas*')).toBe(false)
  })

  it('reads a backslash as escaping the character after it', () => {
    expect(tableMatchesPattern({ schema: 'public', name: 'a*b' }, 'a\\*b')).toBe(true)
    expect(tableMatchesPattern({ schema: 'public', name: 'axb' }, 'a\\*b')).toBe(false)
  })
})
