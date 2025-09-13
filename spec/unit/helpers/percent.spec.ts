import percent from '../../../src/helpers/percent.js'

describe('percent', () => {
  it('returns the percent from a numerator and denominator', () => {
    expect(percent(1, 4)).toEqual(25)
  })

  context('when the denominator is 0', () => {
    it('returns 0', () => {
      expect(percent(1, 0)).toEqual(0)
    })
  })

  context('with precision', () => {
    it('rounds the result to the specified precision', () => {
      expect(percent(1, 3, 4)).toEqual(33.3333)
    })
  })
})
