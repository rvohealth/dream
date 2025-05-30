import cloneDeepSafe, { TypeUnsupportedByClone } from '../../../src/helpers/cloneDeepSafe.js'
import { CalendarDate, DateTime, ops, range } from '../../../src/index.js'
import Latex from '../../../test-app/app/models/Balloon/Latex.js'

describe('cloneDeepSafe', () => {
  context('a string', () => {
    it('is the same string', () => {
      const original = 'hello'
      const clone = cloneDeepSafe(original)
      expect(clone).toEqual(original)
    })
  })

  context('a number', () => {
    it('is the same number', () => {
      const original = 7
      const clone = cloneDeepSafe(original)
      expect(clone).toBe(original)
    })
  })

  context('a bolean', () => {
    it('is the same boolean', () => {
      const original = true
      const clone = cloneDeepSafe(original)
      expect(clone).toBe(true)
    })
  })

  context('undefined', () => {
    it('is undefined', () => {
      const original = undefined
      const clone = cloneDeepSafe(original)
      expect(clone).toBeUndefined()
    })
  })

  context('null', () => {
    it('is null', () => {
      const original = null
      const clone = cloneDeepSafe(original)
      expect(clone).toBeNull()
    })
  })

  context('a Range', () => {
    it('is the same Range (since Ranges are immutable)', () => {
      const original = range(0, 10)
      const clone = cloneDeepSafe(original)
      expect(clone).toBe(original)
    })
  })

  context('an OpsStatement', () => {
    it('is the same OpsStatement (since OpsStatement are immutable)', () => {
      const original = ops.expression('!=', 'red')
      const clone = cloneDeepSafe(original)
      expect(clone).toBe(original)
    })
  })

  context('a DateTime', () => {
    it('is the same DateTime (since DateTimes are immutable)', () => {
      const original = DateTime.now()
      const clone = cloneDeepSafe(original)
      expect(clone).toBe(original)
    })
  })

  context('a CalendarDate', () => {
    it('is the same CalendarDate (since CalendarDates are immutable)', () => {
      const original = CalendarDate.today()
      const clone = cloneDeepSafe(original)
      expect(clone).toBe(original)
    })
  })

  context('an empty array', () => {
    it('is a different array', () => {
      const original: number[] = []
      const clone = cloneDeepSafe(original)
      original.push(1)
      expect(clone).toHaveLength(0)
      expect(clone).toMatchObject([])
    })
  })

  context('an array', () => {
    it('is a different array', () => {
      const original: number[] = [7]
      const clone = cloneDeepSafe(original)
      original.push(1)
      expect(clone).toHaveLength(1)
      expect(clone).toMatchObject([7])
    })
  })

  context('an empty object', () => {
    it('is a different object', () => {
      const original: Record<string, number> = {}
      const clone = cloneDeepSafe(original)
      original['hello'] = 7
      expect(clone).toMatchObject({})
    })
  })

  context('an object', () => {
    it('is a different object', () => {
      const original: Record<string, string> = { hello: 'world' }
      const clone = cloneDeepSafe(original)
      original['hello'] = 'goodbye'
      expect(clone).toMatchObject({ hello: 'world' })
    })
  })

  context("['hello', { world: 'goodbye' }]", () => {
    it('is identical, but not the same objects', () => {
      const original: ['hello', { world: 'goodbye' }] = ['hello', { world: 'goodbye' }]
      const clone = cloneDeepSafe(original)

      expect(clone[0]).toEqual('hello')
      expect(clone[1].world).toEqual('goodbye')

      expect(clone[1]).not.toBe(original[1])
    })
  })

  context('a Dream instance', () => {
    it('is the cloned Dream instance', async () => {
      const original = await Latex.create({ color: 'red' })
      const clone = cloneDeepSafe(original)

      expect(clone.color).toEqual('red')
      expect(clone).toMatchDreamModel(original)
    })
  })

  context('a Set', () => {
    it('throws TypeUnsupportedByClone', () => {
      const original = [new Set()]
      expect(() => cloneDeepSafe(original)).toThrow(TypeUnsupportedByClone)
    })

    context('with a custom unsupported type callback', () => {
      it('returns the value returned by the callback', () => {
        const theSet = new Set()
        const original = [theSet]
        const result = cloneDeepSafe(original, obj => obj)
        expect(result).toHaveLength(1)
        expect(result[0]).toEqual(theSet)
      })
    })
  })
})
