import sortBy from '../../../src/helpers/sortBy.js'
import { ClockTime } from '../../../src/package-exports/index.js'
import CalendarDate from '../../../src/utils/datetime/CalendarDate.js'
import { DateTime } from '../../../src/utils/datetime/DateTime.js'
import Mylar from '../../../test-app/app/models/Balloon/Mylar.js'

describe('sortBy', () => {
  it('sorts by the return value of the provided function', () => {
    const array = [2, 1, 3]
    expect(sortBy(array, a => a)).toEqual([1, 2, 3])
    expect(sortBy(array, a => -a)).toEqual([3, 2, 1])
  })

  it('can sort bigints numerically', () => {
    // note that 333333333333333 has one fewer decimal place than 1111111111111111 or 222222222222222,
    // so it should be sorted first numerically, but by string comparison, it would appear at the end
    const array = [BigInt(2222222222222222), BigInt(1111111111111111), BigInt(333333333333333)]
    expect(sortBy(array, a => a)).toEqual([
      BigInt(333333333333333),
      BigInt(1111111111111111),
      BigInt(2222222222222222),
    ])
    expect(sortBy(array, a => -a)).toEqual([
      BigInt(2222222222222222),
      BigInt(1111111111111111),
      BigInt(333333333333333),
    ])
  })

  it('can sort Dream models', () => {
    const red = Mylar.new({ color: 'red' })
    const blue = Mylar.new({ color: 'blue' })
    const green = Mylar.new({ color: 'green' })

    const array = [red, blue, green]
    expect(sortBy(array, balloon => balloon.color!)).toEqual([blue, green, red])
  })

  it('can sort by DateTime', () => {
    const now = DateTime.now()
    const obj3 = { myDateTime: now.plus({ days: 1 }) }
    const obj1 = { myDateTime: now.minus({ days: 1 }) }
    const obj2 = { myDateTime: now }

    const array = [obj3, obj2, obj1]
    expect(sortBy(array, obj => obj.myDateTime)).toEqual([obj1, obj2, obj3])
  })

  it('can sort by CalendarDate', () => {
    const today = CalendarDate.today()
    const obj3 = { myCalendarDate: today.plus({ days: 1 }) }
    const obj1 = { myCalendarDate: today.minus({ days: 1 }) }
    const obj2 = { myCalendarDate: today }

    const array = [obj3, obj2, obj1]
    expect(sortBy(array, obj => obj.myCalendarDate)).toEqual([obj1, obj2, obj3])
  })

  it('can sort by ClockTime', () => {
    const now = ClockTime.now()
    const obj3 = { myClockTime: now.plus({ microsecond: 1 }) }
    const obj1 = { myClockTime: now.minus({ microsecond: 1 }) }
    const obj2 = { myClockTime: now }

    const array = [obj3, obj2, obj1]
    expect(sortBy(array, obj => obj.myClockTime)).toEqual([obj1, obj2, obj3])
  })

  it('can sort by mixed DateTime and CalendarDate', () => {
    const obj3 = { myDateTimeOrCalendarDate: CalendarDate.tomorrow() }
    const obj1 = { myDateTimeOrCalendarDate: DateTime.now().minus({ days: 1 }) }
    const obj2 = { myDateTimeOrCalendarDate: CalendarDate.today() }

    const array = [obj3, obj2, obj1]
    expect(sortBy(array, obj => obj.myDateTimeOrCalendarDate)).toEqual([obj1, obj2, obj3])
  })

  it('can sort numbers mixed with strings', () => {
    const array = [2, 3, 'world', 1, 'hello']
    expect(sortBy(array, a => String(a))).toEqual([1, 2, 3, 'hello', 'world'])
  })
})
