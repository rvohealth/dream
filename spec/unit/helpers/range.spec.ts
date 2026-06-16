import range from '../../../src/helpers/range.js'

describe('range', () => {
  it('captures begin, end, and excludeEnd', () => {
    const result = range(3, 7, true)
    expect(result.begin).toEqual(3)
    expect(result.end).toEqual(7)
    expect(result.excludeEnd).toBe(true)
  })

  context('when both begin and end are null', () => {
    it('throws', () => {
      expect(() => range(null, null)).toThrow('Must pass either begin or end to a range')
    })
  })

  context('when begin is 0', () => {
    it('does not throw and treats 0 as a valid open-ended lower bound', () => {
      const result = range(0)
      expect(result.begin).toEqual(0)
      expect(result.end).toBeNull()
    })
  })

  context('when begin is 0n (bigint)', () => {
    it('does not throw and treats 0n as a valid lower bound', () => {
      const result = range(0n)
      expect(result.begin).toEqual(0n)
    })
  })

  context('when end is 0 and begin is null', () => {
    it('does not throw and treats 0 as a valid upper bound', () => {
      const result = range(null, 0)
      expect(result.end).toEqual(0)
    })
  })
})
