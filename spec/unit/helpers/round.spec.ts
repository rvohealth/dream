import round, { RoundingPrecision } from '../../../src/helpers/round'

describe('round', () => {
  let subject = () => round(value, precision)
  let value: number
  let precision: RoundingPrecision | undefined

  beforeEach(() => {
    value = 0.999999999999
    precision = undefined
  })

  context('when precision is 0', () => {
    beforeEach(() => {
      precision = 0
    })

    it('it rounds the whole number UP if 5 or more', () => {
      value = 0.5
      expect(subject()).toEqual(1)
    })

    it('it rounds the whole number DOWN if 4 or less', () => {
      value = 0.4
      expect(subject()).toEqual(0)
    })
  })

  context('when precision is 1', () => {
    beforeEach(() => {
      precision = 1
    })

    it('it rounds the 10th place UP if 5 or more', () => {
      value = 0.15
      expect(subject()).toEqual(0.2)
    })

    it('it rounds the 10th place DOWN if 4 or less', () => {
      value = 0.14
      expect(subject()).toEqual(0.1)
    })
  })

  context('when precision is 2', () => {
    beforeEach(() => {
      precision = 2
    })

    it('it rounds the 100th place UP if 5 or more', () => {
      value = 0.115
      expect(subject()).toEqual(0.12)
    })

    it('it rounds the 100th place DOWN if 4 or less', () => {
      value = 0.114
      expect(subject()).toEqual(0.11)
    })
  })

  context('when precision is 3', () => {
    beforeEach(() => {
      precision = 3
    })

    it('it rounds the 1000th place UP if 5 or more', () => {
      value = 0.1115
      expect(subject()).toEqual(0.112)
    })

    it('it rounds the 1000th place DOWN if 4 or less', () => {
      value = 0.1114
      expect(subject()).toEqual(0.111)
    })
  })
})
