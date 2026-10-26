import areEqual from '../../../src/helpers/areEqual.js'
import { ClockTime, ClockTimeTz } from '../../../src/package-exports/index.js'
import CalendarDate from '../../../src/utils/datetime/CalendarDate.js'
import { DateTime } from '../../../src/utils/datetime/DateTime.js'
import GraphNode from '../../../test-app/app/models/Graph/Node.js'

describe('areEqual', () => {
  it('can compare undefineds', () => {
    expect(areEqual(undefined, undefined)).toBe(true)
  })

  it('can compare nulls', () => {
    expect(areEqual(null, null)).toBe(true)
  })

  it('can compare null and undefined', () => {
    expect(areEqual(null, undefined)).toBe(false)
  })

  it('can compare null and falsey values', () => {
    expect(areEqual(false, null)).toBe(false)
    expect(areEqual(0, null)).toBe(false)
    expect(areEqual('', null)).toBe(false)
  })

  it('can compare undefined and falsey values', () => {
    expect(areEqual(false, undefined)).toBe(false)
    expect(areEqual(0, undefined)).toBe(false)
    expect(areEqual('', undefined)).toBe(false)
  })

  it('can compare booleans', () => {
    expect(areEqual(true, true)).toBe(true)
    expect(areEqual(false, false)).toBe(true)
    expect(areEqual(false, true)).toBe(false)
  })

  it('can compare integers', () => {
    expect(areEqual(7, 7)).toBe(true)
    expect(areEqual(7, 3)).toBe(false)
  })

  it('can compare integers and strings', () => {
    expect(areEqual(7, '7')).toBe(false)
  })

  it('can compare integers and decimals', () => {
    expect(areEqual(7, 7.0)).toBe(true)
    expect(areEqual(7, 7.1)).toBe(false)
  })

  it('can compare decimals', () => {
    expect(areEqual(7.1, 7.1)).toBe(true)
    expect(areEqual(7.3, 7.1)).toBe(false)
  })

  it('can compare decimals and strings', () => {
    expect(areEqual(7.1, '7.1')).toBe(false)
  })

  it('can compare strings', () => {
    expect(areEqual('hello', 'hello')).toBe(true)
    expect(areEqual('hello', 'hello ')).toBe(false)
  })

  it('can compare DateTimes', () => {
    const dateTime1 = DateTime.now()
    const dateTime2 = DateTime.fromISO(dateTime1.toISO())
    expect(areEqual(dateTime1, dateTime2)).toBe(true)
    expect(areEqual(dateTime1, dateTime1.plus({ millisecond: 1 }))).toBe(false)
  })

  it('can compare CalendarDates', () => {
    const date1 = CalendarDate.today()
    const date2 = CalendarDate.fromISO(date1.toISO())
    expect(areEqual(date1, date2)).toBe(true)
    expect(areEqual(date1, date1.plus({ day: 1 }))).toBe(false)
  })

  it('can compare ClockTimes', () => {
    const dateTime1 = ClockTime.now()
    const dateTime2 = ClockTime.fromISO(dateTime1.toISO())
    expect(areEqual(dateTime1, dateTime2)).toBe(true)
    expect(areEqual(dateTime1, dateTime1.plus({ millisecond: 1 }))).toBe(false)
  })

  it('can compare ClockTimeTzs', () => {
    const dateTime1 = ClockTimeTz.now()
    const dateTime2 = ClockTimeTz.fromISO(dateTime1.toISO())
    expect(areEqual(dateTime1, dateTime2)).toBe(true)
    expect(areEqual(dateTime1, dateTime1.plus({ millisecond: 1 }))).toBe(false)
  })

  it('can compare javascript Dates', () => {
    const dateTime1 = DateTime.now()
    const dateTime2 = DateTime.fromISO(dateTime1.toISO())
    expect(areEqual(dateTime1.toJSDate(), dateTime2.toJSDate())).toBe(true)
    expect(areEqual(dateTime1.toJSDate(), dateTime1.plus({ millisecond: 1 }).toJSDate())).toBe(false)
  })

  it('can compare arrays of strings', () => {
    const array1 = ['hello', 'world']
    const array2 = ['hello', 'world']
    const array3 = ['goodbye']
    expect(areEqual(array1, array2)).toBe(true)
    expect(areEqual(array1, array3)).toBe(false)
  })

  it('can compare arrays of integers', () => {
    const array1 = [1, 2]
    const array2 = [1, 2]
    const array3 = [1, 2, 3]
    const array4 = [3]
    expect(areEqual(array1, array2)).toBe(true)
    expect(areEqual(array1, array3)).toBe(false)
    expect(areEqual(array1, array4)).toBe(false)
  })

  context('sparse arrays', () => {
    it('does not equate all holes with concrete values in either order', () => {
      const sparse = new Array<number>(2)
      expect(areEqual(sparse, [1, 2])).toBe(false)
      expect(areEqual([1, 2], sparse)).toBe(false)
    })

    it('compares holes before and after populated positions in either order', () => {
      const leadingHole = new Array<number>(2)
      leadingHole[1] = 1
      const trailingHole = new Array<number>(2)
      trailingHole[0] = 1

      expect(areEqual(leadingHole, [2, 1])).toBe(false)
      expect(areEqual([2, 1], leadingHole)).toBe(false)
      expect(areEqual(trailingHole, [1, 2])).toBe(false)
      expect(areEqual([1, 2], trailingHole)).toBe(false)
    })

    it('equates holes with undefined but distinguishes null in either order', () => {
      const sparse = new Array<number>(1)
      expect(areEqual(sparse, [undefined])).toBe(true)
      expect(areEqual([undefined], sparse)).toBe(true)
      expect(areEqual(sparse, [null])).toBe(false)
      expect(areEqual([null], sparse)).toBe(false)
      expect(areEqual([undefined], [null])).toBe(false)
      expect(areEqual([null], [undefined])).toBe(false)
    })

    it('equates equivalent sparse arrays and rejects different lengths in either order', () => {
      const sparse = new Array<number>(2)
      sparse[1] = 1
      const equivalent = new Array<number>(2)
      equivalent[1] = 1

      expect(areEqual(sparse, equivalent)).toBe(true)
      expect(areEqual(equivalent, sparse)).toBe(true)
      expect(areEqual(new Array<number>(2), new Array<number>(2))).toBe(true)
      expect(areEqual(sparse, [1])).toBe(false)
      expect(areEqual([1], sparse)).toBe(false)
    })

    it('recursively compares nested sparse arrays in either order', () => {
      const sparse = new Array<number>(2)
      sparse[1] = 1

      expect(areEqual([sparse], [[2, 1]])).toBe(false)
      expect(areEqual([[2, 1]], [sparse])).toBe(false)
      expect(areEqual([sparse], [[undefined, 1]])).toBe(true)
      expect(areEqual([[undefined, 1]], [sparse])).toBe(true)
    })
  })

  it('can compare arrays whose first differing element is falsy', () => {
    expect(areEqual([0], [1])).toBe(false)
    expect(areEqual([false], [true])).toBe(false)
    expect(areEqual([''], ['a'])).toBe(false)
    expect(areEqual([null], [1])).toBe(false)
    expect(areEqual([0, 1], [5, 9])).toBe(false)
    expect(areEqual([1, 0], [1, 7])).toBe(false)
  })

  it('can compare equal arrays that contain falsy elements', () => {
    expect(areEqual([0], [0])).toBe(true)
    expect(areEqual([null], [null])).toBe(true)
    expect(areEqual([false, ''], [false, ''])).toBe(true)
    expect(areEqual([1, 0, null], [1, 0, null])).toBe(true)
  })

  it('can compare NaN to itself', () => {
    expect(areEqual(NaN, NaN)).toBe(true)
    expect(areEqual(NaN, 7)).toBe(false)
  })

  it('can compare equal arrays that contain NaN', () => {
    expect(areEqual([NaN], [NaN])).toBe(true)
    expect(areEqual([1, NaN], [1, NaN])).toBe(true)
    expect(areEqual([NaN], [1])).toBe(false)
  })

  it('can compare simple objects', () => {
    const obj1 = { hello: 'world' }
    const obj2 = { hello: 'world' }
    const obj3 = { hello: 'goodbye' }
    expect(areEqual(obj1, obj2)).toBe(true)
    expect(areEqual(obj1, obj3)).toBe(false)
  })

  it('can compare Dreams', async () => {
    const graphNode1 = await GraphNode.create({ name: 'Hello' })
    const graphNode2 = await GraphNode.create({ name: 'Hello' })
    const graphNode3 = await GraphNode.find(graphNode1.id)

    expect(areEqual(graphNode1, graphNode3)).toBe(true)
    expect(areEqual(graphNode1, graphNode2)).toBe(false)
  })

  it('can compare Dream and null', async () => {
    const graphNode = await GraphNode.create({ name: 'Hello' })

    expect(areEqual(graphNode, null)).toBe(false)
  })
})
