import sort from '../../../src/helpers/sort.js'

describe('sort', () => {
  it('sorts numbers in ascending order', () => {
    const array = [2, 1, 3]
    expect(sort(array)).toEqual([1, 2, 3])
  })

  it('sorts strings in ascending order', () => {
    const array = ['world', 'Hello', 'hello', 'World']
    expect(sort(array)).toEqual(['hello', 'Hello', 'world', 'World'])
  })

  it('sorts bigints in ascending order', () => {
    const array = [BigInt(2222222222222222), BigInt(1111111111111111), BigInt(3333333333333333)]
    expect(sort(array)).toEqual([
      BigInt(1111111111111111),
      BigInt(2222222222222222),
      BigInt(3333333333333333),
    ])
  })
})
