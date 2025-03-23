import sortBy from '../../../src/helpers/sortBy.js'
import Mylar from '../../../test-app/app/models/Balloon/Mylar.js'

describe('sortBy', () => {
  it('sorts by the return value of the provided function', () => {
    const array = [2, 1, 3]
    expect(sortBy(array, a => a)).toEqual([1, 2, 3])
    expect(sortBy(array, a => -a)).toEqual([3, 2, 1])
  })

  it('can sort Dream models', async () => {
    const red = await Mylar.create({ color: 'red' })
    const blue = await Mylar.create({ color: 'blue' })
    const green = await Mylar.create({ color: 'green' })

    const array = [red, blue, green]
    expect(sortBy(array, balloon => balloon.color!)).toEqual([blue, green, red])
  })
})
