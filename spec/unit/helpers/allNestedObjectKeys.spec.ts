import allNestedObjectKeys from '../../../src/helpers/allNestedObjectKeys.js'

describe('allNestedObjectKeys', () => {
  context('{ hello: "world" }', () => {
    it('returns ["hello"]', () => {
      expect(allNestedObjectKeys({ hello: 'world' })).toEqual(['hello'])
    })
  })

  context('{ hello: { world: "goodbye" } }', () => {
    it('returns ["hello", "world"]', () => {
      expect(allNestedObjectKeys({ hello: { world: 'goodbye' } })).toEqual(['hello', 'world'])
    })
  })

  context('{ hello: { world: "goodbye" }, hello2: { world2: "goodbye2" } }', () => {
    it('returns ["hello", "world", "hello2", "world2"]', () => {
      expect(allNestedObjectKeys({ hello: { world: 'goodbye' }, hello2: { world2: 'goodbye' } })).toEqual([
        'hello',
        'world',
        'hello2',
        'world2',
      ])
    })
  })

  context('{ hello: { world: "goodbye", hello2: { world2: "goodbye2" } } }', () => {
    it('returns ["hello", "world", "hello2", "world2"]', () => {
      expect(allNestedObjectKeys({ hello: { world: 'goodbye', hello2: { world2: 'goodbye' } } })).toEqual([
        'hello',
        'world',
        'hello2',
        'world2',
      ])
    })
  })
})
