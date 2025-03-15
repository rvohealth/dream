import validateTable from '../../../../src/db/validators/validateTable.js'
import InvalidTableName from '../../../../src/errors/InvalidTableName.js'
import User from '../../../../test-app/app/models/User.js'

describe('validateTable', () => {
  it('returns the table string with a valid table', () => {
    expect(validateTable(User.prototype.schema, 'compositions')).toEqual('compositions')
  })

  it('raises an exception with an invalid table', () => {
    expect(() => {
      validateTable(User.prototype.schema, 'compositionz' as any)
    }).toThrow(InvalidTableName)
  })
})
