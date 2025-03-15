import isEmpty from '../../../src/helpers/isEmpty.js'

describe('isEmpty', () => {
  context('[]', () => {
    it('is true', () => {
      expect(isEmpty([])).toBe(true)
    })
  })

  context('{}', () => {
    it('is true', () => {
      expect(isEmpty({})).toBe(true)
    })
  })

  context('non empty array', () => {
    it('is false', () => {
      expect(isEmpty(['hello'])).toBe(false)
    })
  })

  context('non empty object', () => {
    it('is false', () => {
      expect(isEmpty({ hello: 'world' })).toBe(false)
    })
  })
})
