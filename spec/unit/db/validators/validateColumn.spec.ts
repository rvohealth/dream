import validateColumn from '../../../../src/db/validators/validateColumn.js'
import InvalidColumnName from '../../../../src/errors/InvalidColumnName.js'
import User from '../../../../test-app/app/models/User.js'

describe('validateColumn', () => {
  it('returns the table string with a valid table', () => {
    expect(validateColumn(User.prototype.schema, 'compositions', 'content')).toEqual('content')
  })

  it('raises an exception with an invalid table', () => {
    expect(() => {
      validateColumn(User.prototype.schema, 'compositionz' as any, 'content')
    }).toThrow(InvalidColumnName)
  })

  it('raises an exception with an invalid columnName', () => {
    expect(() => {
      validateColumn(User.prototype.schema, 'compositions', 'contenz' as any)
    }).toThrow(InvalidColumnName)
  })
})
