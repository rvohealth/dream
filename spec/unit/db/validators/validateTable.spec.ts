import validateTable from '../../../../src/db/validators/validateTable'
import InvalidTableName from '../../../../src/exceptions/invalid-table-name'
import User from '../../../../test-app/app/models/User'

describe('validateTable', () => {
  it('returns the table string with a valid table', () => {
    expect(validateTable(User.prototype.dreamconf.dbTypeCache, 'compositions')).toEqual('compositions')
  })

  it('raises an exception with an invalid table', () => {
    expect(() => {
      validateTable(User.prototype.dreamconf.dbTypeCache, 'compositionz')
    }).toThrowError(InvalidTableName)
  })
})
