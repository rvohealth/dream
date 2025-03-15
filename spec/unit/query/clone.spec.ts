import User from '../../../test-app/app/models/User.js'

describe('Query#clone', () => {
  it('returns a new copy of the query', () => {
    const query = User.query().where({ id: 1 })
    const clone = query['clone']()
    expect(clone).not.toBe(query)
    expect(clone.sql()).toEqual(query.sql())
    const newClone = clone.where({ id: 2 })
    expect(newClone.sql()).not.toEqual(query.sql())
    expect(newClone.sql()).not.toEqual(clone.sql())
  })

  it('clones the connection', () => {
    const query = User.query().connection('primary')
    const clone = query['clone']()
    expect(clone['connectionOverride']).toEqual('primary')
  })
})
