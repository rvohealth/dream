import objectPathsToArrays from '../../../src/helpers/objectPathsToArrays'

describe('objectPathsToArrays', () => {
  context('{ hello: {} }', () => {
    it('returns [["hello"]]', () => {
      expect(objectPathsToArrays({ hello: {} })).toEqual([['hello']])
    })
  })

  context('{ hello: { world: {} } }', () => {
    it('returns ["hello", "world"]', () => {
      expect(objectPathsToArrays({ hello: { world: {} } })).toEqual([['hello', 'world']])
    })
  })

  context('{ hello: { world: {} }, hello2: { world2: {} } }', () => {
    it('returns [["hello", "world"], ["hello2", "world2"]]', () => {
      expect(objectPathsToArrays({ hello: { world: {} }, hello2: { world2: {} } })).toEqual([
        ['hello', 'world'],
        ['hello2', 'world2'],
      ])
    })
  })

  context('{ hello: { world: {}, hello2: { world2: {} } } }', () => {
    it('returns [["hello", "world"], ["hello", "hello2", "world2"]]', () => {
      console.dir(objectPathsToArrays({ hello: { world: {}, hello2: { world2: {} } } }), { depth: null })
      expect(objectPathsToArrays({ hello: { world: {}, hello2: { world2: {} } } })).toEqual([
        ['hello', 'world'],
        ['hello', 'hello2', 'world2'],
      ])
    })
  })
})
