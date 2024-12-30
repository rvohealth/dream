import validateTableAlias from '../../../../src/db/validators/validateTableAlias'
import InvalidTableAlias from '../../../../src/errors/InvalidTableAlias'

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
      expect(() => validateTableAlias('compositions ')).toThrow(InvalidTableAlias)
    })

    it('raises an exception with a dot', () => {
      expect(() => validateTableAlias('compositions.id')).toThrow(InvalidTableAlias)
    })

    it('raises an exception with a semicolon', () => {
      expect(() => validateTableAlias('compositions;')).toThrow(InvalidTableAlias)
    })

    it('raises an exception when using an sql keyword', () => {
      expect(() => validateTableAlias('select')).toThrow(InvalidTableAlias)
      expect(() => validateTableAlias('SELECT')).toThrow(InvalidTableAlias)
      expect(() => validateTableAlias('create')).toThrow(InvalidTableAlias)
      expect(() => validateTableAlias('update')).toThrow(InvalidTableAlias)
      expect(() => validateTableAlias('delete')).toThrow(InvalidTableAlias)
      expect(() => validateTableAlias('table')).toThrow(InvalidTableAlias)
      expect(() => validateTableAlias('truncate')).toThrow(InvalidTableAlias)
      expect(() => validateTableAlias('drop')).toThrow(InvalidTableAlias)
      expect(() => validateTableAlias('exec')).toThrow(InvalidTableAlias)
    })
  })
})
