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

  context('empty Map', () => {
    it('is true', () => {
      expect(isEmpty(new Map())).toBe(true)
    })
  })

  context('empty Set', () => {
    it('is true', () => {
      expect(isEmpty(new Set())).toBe(true)
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

  context('non empty Map', () => {
    it('is false', () => {
      expect(isEmpty(new Map([['a', 1]]))).toBe(false)
    })
  })

  context('non empty Set', () => {
    it('is false', () => {
      expect(isEmpty(new Set(['a']))).toBe(false)
    })
  })
})
