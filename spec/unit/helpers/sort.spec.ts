import sort from '../../../src/helpers/sort.js'
import CalendarDate from '../../../src/utils/datetime/CalendarDate.js'
import { DateTime } from '../../../src/utils/datetime/DateTime.js'

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

  it('sorts bigints numerically', () => {
    // note that 333333333333333 has one fewer decimal place than 1111111111111111 or 222222222222222,
    // so it should be sorted first numerically, but by string comparison, it would appear at the end
    const array = [BigInt(2222222222222222), BigInt(1111111111111111), BigInt(333333333333333)]
    expect(sort(array)).toEqual([BigInt(333333333333333), BigInt(1111111111111111), BigInt(2222222222222222)])
  })

  it('sorts negative bigints numerically', () => {
    // note that -333333333333333 has one fewer decimal place than -1111111111111111 or -222222222222222,
    // so it should be sorted last numerically
    const array = [BigInt(-2222222222222222), BigInt(-1111111111111111), BigInt(-333333333333333)]
    expect(sort(array)).toEqual([
      BigInt(-2222222222222222),
      BigInt(-1111111111111111),
      BigInt(-333333333333333),
    ])
  })

  it('sorts negative bigints before positive bigints', () => {
    // note that 333333333333333 has one fewer decimal place than 1111111111111111 or 222222222222222,
    // so it should be sorted first numerically, but by string comparison, it would appear at the end
    // note that -333333333333333 has one fewer decimal place than -1111111111111111 or -222222222222222,
    // so it should be sorted last numerically
    const array = [
      BigInt(2222222222222222),
      BigInt(1111111111111111),
      BigInt(333333333333333),
      BigInt(-2222222222222222),
      BigInt(-1111111111111111),
      BigInt(-333333333333333),
    ]
    expect(sort(array)).toEqual([
      BigInt(-2222222222222222),
      BigInt(-1111111111111111),
      BigInt(-333333333333333),
      BigInt(333333333333333),
      BigInt(1111111111111111),
      BigInt(2222222222222222),
    ])
  })

  it('can sort DateTimes', () => {
    const obj3 = DateTime.now().plus({ days: 1 })
    const obj1 = DateTime.now().minus({ days: 1 })
    const obj2 = DateTime.now()

    const array = [obj3, obj2, obj1]
    expect(sort(array)).toEqual([obj1, obj2, obj3])
  })

  it('can sort CalendarDates', () => {
    const obj3 = CalendarDate.today().plus({ days: 1 })
    const obj1 = CalendarDate.today().minus({ days: 1 })
    const obj2 = CalendarDate.today()

    const array = [obj3, obj2, obj1]
    expect(sort(array)).toEqual([obj1, obj2, obj3])
  })

  it('can sort mixed DateTimes and CalendarDates', () => {
    const obj3 = CalendarDate.today().plus({ days: 1 })
    const obj1 = DateTime.now().minus({ days: 1 })
    const obj2 = CalendarDate.today()

    const array = [obj3, obj2, obj1]
    expect(sort(array)).toEqual([obj1, obj2, obj3])
  })
})
