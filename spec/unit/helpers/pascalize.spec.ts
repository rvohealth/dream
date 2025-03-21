import pascalize from '../../../src/helpers/pascalize.js'
import { CalendarDate, DateTime } from '../../../src/index.js'
import Balloon from '../../../test-app/app/models/Balloon.js'

describe('pascalize', () => {
  context('when passed a string', () => {
    it('pascalizes string', () => {
      expect(pascalize('helloWorld-how-are-you')).toEqual('HelloWorldHowAreYou')
    })

    it.skip('type test', () => {
      const alteredCase = pascalize('helloWorld-how-are-you')
      if (alteredCase === 'HelloWorldHowAreYou') {
        // The previous line will start being a type error if `alteredCase` is anything other
        // than what we've written in conditional
      }
    })

    context('spaces', () => {
      context('single space', () => {
        it('are camelized', () => {
          expect(pascalize('hello world')).toEqual('HelloWorld')
        })

        it.skip('type test', () => {
          const alteredCase = pascalize('hello world')
          if (alteredCase === 'HelloWorld') {
            // The previous line will start being a type error if `alteredCase` is anything other
            // than what we've written in conditional
          }
        })
      })

      context('multiple spaces', () => {
        it('are camelized', () => {
          expect(pascalize('hello    world')).toEqual('HelloWorld')
        })

        it.skip('type test', () => {
          const alteredCase = pascalize('hello   world')
          if (alteredCase === 'HelloWorld') {
            // The previous line will start being a type error if `alteredCase` is anything other
            // than what we've written in conditional
          }
        })
      })
    })

    context('when the string is snake case, and a number starts one of the sections of the string', () => {
      it('pascalizes string', () => {
        expect(pascalize('fiber_2016_2018_2020_2022_2024')).toEqual('Fiber20162018202020222024')
      })
    })
  })

  context('when passed undefined', () => {
    it('returns undefined', () => {
      expect(pascalize(undefined)).toBeUndefined()
    })
  })

  context('when passed null', () => {
    it('returns null', () => {
      expect(pascalize(null)).toBeNull()
    })
  })

  context('when passed an object', () => {
    it('pascalizes keys, not values', () => {
      expect(pascalize({ hello_world: 'how_are_you' })).toEqual({ HelloWorld: 'how_are_you' })
    })

    context('when passed a key with a DateTime value', () => {
      it('does not alter DateTimes', () => {
        const now = DateTime.now()
        expect(pascalize({ hello_world: now })).toEqual({ HelloWorld: now })
      })
    })

    context('when passed a key with a CalendarDate value', () => {
      it('does not alter CalendarDates', () => {
        const today = CalendarDate.today()
        expect(pascalize({ hello_world: today })).toEqual({ HelloWorld: today })
      })
    })

    context('when passed a key with a Dream value', () => {
      it('does not alter Dream models', () => {
        const balloon = Balloon.new()
        expect(pascalize({ hello_world: balloon })).toEqual({ HelloWorld: balloon })
      })
    })

    context('when passed a key with a null value', () => {
      it('pascalizes the key', () => {
        expect(pascalize({ hello_world: null })).toEqual({ HelloWorld: null })
      })
    })

    context('when passed a key with an undefined value', () => {
      it('does not crash', () => {
        expect(pascalize({ hello_world: undefined })).toEqual({})
      })
    })
  })

  context('recurses', () => {
    const object = {
      hello_world: [{ goodbye_world: 'kind_world' }, 'for_now'],
      world_home: { earth_home: 'home_sweet_home' },
    } as const

    it('pascalizes keys', () => {
      expect(pascalize(object)).toEqual({
        HelloWorld: [{ GoodbyeWorld: 'kind_world' }, 'for_now'],
        WorldHome: { EarthHome: 'home_sweet_home' },
      })
    })

    it.skip('type test', () => {
      const alteredCase = pascalize(object)

      if (
        alteredCase.WorldHome.EarthHome === 'home_sweet_home' ||
        alteredCase.HelloWorld[0].GoodbyeWorld === 'kind_world' ||
        alteredCase.HelloWorld[1] === 'for_now'
      ) {
        // The previous line will start being a type error if `alteredCase` is anything other
        // than what we've written in conditional
      }
    })
  })
})
