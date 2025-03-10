import sortBy from '../../../src/helpers/sortBy'

describe('sortBy', () => {
  it('sorts by the return value of the provided function', () => {
    const array = [2, 1, 3]
    expect(sortBy(array, a => a)).toEqual([1, 2, 3])
    expect(sortBy(array, a => -a)).toEqual([3, 2, 1])
  })
})
