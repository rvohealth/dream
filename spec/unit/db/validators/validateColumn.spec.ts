import validateColumn from '../../../../src/db/validators/validateColumn'
import InvalidColumnName from '../../../../src/exceptions/invalid-column-name'
import User from '../../../../test-app/app/models/User'

describe('validateColumn', () => {
  it('returns the table string with a valid table', () => {
    expect(validateColumn(User.prototype.dreamconf.dbTypeCache, 'compositions', 'content')).toEqual('content')
  })

  it('raises an exception with an invalid table', () => {
    expect(() => {
      validateColumn(User.prototype.dreamconf.dbTypeCache, 'compositionz', 'content')
    }).toThrowError(InvalidColumnName)
  })

  it('raises an exception with an invalid columnName', () => {
    expect(() => {
      validateColumn(User.prototype.dreamconf.dbTypeCache, 'compositions', 'contenz')
    }).toThrowError(InvalidColumnName)
  })
})
