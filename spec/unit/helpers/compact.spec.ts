import compact from '../../../src/helpers/compact'

describe('compact(obj)', () => {
  it('strips null values from object', () => {
    const compacted = compact({ hello: 'world', hatesChalupas: false, calvin: null, coolidge: undefined })
    expect(compacted).toEqual({ hello: 'world', hatesChalupas: false })
  })

  describe('passed an array', () => {
    it('removes undefined and null values', () => {
      const compacted = compact([1, 2, undefined, null])
      expect(compacted).toEqual([1, 2])
    })
  })
})
