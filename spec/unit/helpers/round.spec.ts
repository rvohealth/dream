import round, { RoundingPrecision } from '../../../src/helpers/round.js'

describe('round', () => {
  let precision: RoundingPrecision | undefined

  beforeEach(() => {
    precision = undefined
  })

  context('when precision is 0', () => {
    beforeEach(() => {
      precision = 0
    })

    it('rounds the whole number UP if 5 or more', () => {
      expect(round(0.5, precision)).toEqual(1)
    })

    it('rounds the whole number DOWN if 4 or less', () => {
      expect(round(0.4, precision)).toEqual(0)
    })
  })

  context('when precision is 1', () => {
    beforeEach(() => {
      precision = 1
    })

    it('rounds the 10th place UP if 5 or more', () => {
      expect(round(0.15, precision)).toEqual(0.2)
    })

    it('rounds the 10th place DOWN if 4 or less', () => {
      expect(round(0.14, precision)).toEqual(0.1)
    })
  })

  context('when precision is 2', () => {
    beforeEach(() => {
      precision = 2
    })

    it('rounds the 100th place UP if 5 or more', () => {
      expect(round(0.115, precision)).toEqual(0.12)
    })

    it('rounds the 100th place DOWN if 4 or less', () => {
      expect(round(0.114, precision)).toEqual(0.11)
    })
  })

  context('when precision is 3', () => {
    beforeEach(() => {
      precision = 3
    })

    it('rounds the 1000th place UP if 5 or more', () => {
      expect(round(0.1115, precision)).toEqual(0.112)
    })

    it('rounds the 1000th place DOWN if 4 or less', () => {
      expect(round(0.1114, precision)).toEqual(0.111)
    })
  })
})
