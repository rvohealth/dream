import sort from '../../../src/helpers/sort.js'
import { ClockTime } from '../../../src/package-exports/index.js'
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
    const now = DateTime.now()
    const obj3 = now.plus({ days: 1 })
    const obj1 = now.minus({ days: 1 })
    const obj2 = now

    const array = [obj3, obj2, obj1]
    expect(sort(array)).toEqual([obj1, obj2, obj3])
  })

  it('can sort CalendarDates', () => {
    const today = CalendarDate.today()
    const obj3 = today.plus({ days: 1 })
    const obj1 = today.minus({ days: 1 })
    const obj2 = today

    const array = [obj3, obj2, obj1]
    expect(sort(array)).toEqual([obj1, obj2, obj3])
  })

  it('can sort ClockTimes', () => {
    const now = ClockTime.now()
    const obj3 = now.plus({ millisecond: 1 })
    const obj1 = now.minus({ millisecond: 1 })
    const obj2 = now

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
