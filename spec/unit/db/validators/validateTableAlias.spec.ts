import validateTableAlias from '../../../../src/db/validators/validateTableAlias'
import InvalidTableAlias from '../../../../src/exceptions/invalid-table-alias'

describe('validateTableAlias', () => {
  context('valid table alias is provided', () => {
    it('returns the table alias', () => {
      expect(validateTableAlias('compositions')).toEqual('compositions')
      expect(validateTableAlias('userCompositions')).toEqual('userCompositions')
      expect(validateTableAlias('user_compositions')).toEqual('user_compositions')
    })
  })

  context('invalid table alias is provided', () => {
    it('raises an exception with space', () => {
      expect(() => validateTableAlias('compositions ')).toThrowError(InvalidTableAlias)
    })

    it('raises an exception with a dot', () => {
      expect(() => validateTableAlias('compositions.id')).toThrowError(InvalidTableAlias)
    })

    it('raises an exception with a semicolon', () => {
      expect(() => validateTableAlias('compositions;')).toThrowError(InvalidTableAlias)
    })

    it('raises an exception when using an sql keyword', () => {
      expect(() => validateTableAlias('select')).toThrowError(InvalidTableAlias)
      expect(() => validateTableAlias('SELECT')).toThrowError(InvalidTableAlias)
      expect(() => validateTableAlias('create')).toThrowError(InvalidTableAlias)
      expect(() => validateTableAlias('update')).toThrowError(InvalidTableAlias)
      expect(() => validateTableAlias('delete')).toThrowError(InvalidTableAlias)
      expect(() => validateTableAlias('table')).toThrowError(InvalidTableAlias)
      expect(() => validateTableAlias('truncate')).toThrowError(InvalidTableAlias)
      expect(() => validateTableAlias('drop')).toThrowError(InvalidTableAlias)
      expect(() => validateTableAlias('exec')).toThrowError(InvalidTableAlias)
    })
  })
})
