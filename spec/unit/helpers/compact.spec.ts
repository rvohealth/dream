import compact from '../../../src/helpers/compact.js'

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

  it.skip('type test', () => {
    const input = inputValue()
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const result: Record<string, string> = compact({ hello: input })
  })
})

function inputValue(): string | null | undefined {
  return null
}
