import isSortedCorrectly from '../../../../../src/decorators/field/sortable/helpers/isSortedCorrectly.js'

describe('isSortedCorrectly', () => {
  const subject = () => isSortedCorrectly(data, 'position')
  let data: any[]

  context('with valid positions passed', () => {
    beforeEach(() => {
      data = [
        { position: 1 },
        { position: 2 },
        { position: 3 },
        { position: 4 },
        { position: 5 },
        { position: 6 },
        { position: 7 },
        { position: 8 },
        { position: 9 },
        { position: 10 },
      ]
    })
    it('returns true', () => {
      expect(subject()).toBe(true)
    })
  })

  context('with invalid positions passed', () => {
    beforeEach(() => {
      data = [
        { position: 10 },
        { position: 1 },
        { position: 2 },
        { position: 3 },
        { position: 4 },
        { position: 5 },
        { position: 6 },
        { position: 7 },
        { position: 8 },
        { position: 9 },
      ]
    })

    it('returns false', () => {
      expect(subject()).toBe(false)
    })
  })
})
