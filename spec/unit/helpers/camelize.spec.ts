import { DateTime } from 'luxon'
import { CalendarDate } from '../../../src.js'
import camelize from '../../../src/helpers/camelize.js'
import Balloon from '../../../test-app/app/models/Balloon.js'

describe('camelize', () => {
  context('when passed a string', () => {
    it('camelizes string', () => {
      expect(camelize('HelloWorld-how-are-you')).toEqual('helloWorldHowAreYou')
    })

    it.skip('type test', () => {
      const alteredCase = camelize('HelloWorld-how-are-you')
      if (alteredCase === 'helloWorldHowAreYou') {
        // The previous line will start being a type error if `alteredCase` is anything other
        // than what we've written in conditional
      }
    })

    it('removes leading and trailing underscores', () => {
      expect(camelize('_hello_world_')).toEqual('helloWorld')
    })

    it.skip('type test', () => {
      const alteredCase = camelize('_hello_world_')
      if (alteredCase === 'helloWorld') {
        // The previous line will start being a type error if `alteredCase` is anything other
        // than what we've written in conditional
      }
    })

    it('camelizes string', () => {
      expect(camelize('HelloWorld-how-are---you')).toEqual('helloWorldHowAreYou')
    })

    it.skip('type test', () => {
      const alteredCase = camelize('HelloWorld-how-are---you')
      if (alteredCase === 'helloWorldHowAreYou') {
        // The previous line will start being a type error if `alteredCase` is anything other
        // than what we've written in conditional
      }
    })

    context('when the string is snake case, and a number starts one of the sections of the string', () => {
      it('camelizes string', () => {
        expect(camelize('fiber_2016_2018_2020_2022_2024')).toEqual('fiber20162018202020222024')
      })

      it.skip('type test', () => {
        const alteredCase = camelize('fiber_2016_2018_2020_2022_2024')
        if (alteredCase === 'fiber20162018202020222024') {
          // The previous line will start being a type error if `alteredCase` is anything other
          // than what we've written in conditional
        }
      })
    })

    context('periods', () => {
      it('are ignored', () => {
        expect(camelize('hello.world')).toEqual('hello.world')
      })
    })

    it.skip('type test', () => {
      const alteredCase = camelize('hello.world')
      if (alteredCase === 'hello.world') {
        // The previous line will start being a type error if `alteredCase` is anything other
        // than what we've written in conditional
      }
    })

    context('spaces', () => {
      context('single space', () => {
        it('are camelized', () => {
          expect(camelize('hello world')).toEqual('helloWorld')
        })

        it.skip('type test', () => {
          const alteredCase = camelize('hello world')
          if (alteredCase === 'helloWorld') {
            // The previous line will start being a type error if `alteredCase` is anything other
            // than what we've written in conditional
          }
        })
      })

      context('multiple spaces', () => {
        it('are camelized', () => {
          expect(camelize('hello    world')).toEqual('helloWorld')
        })

        it.skip('type test', () => {
          const alteredCase = camelize('hello   world')
          if (alteredCase === 'helloWorld') {
            // The previous line will start being a type error if `alteredCase` is anything other
            // than what we've written in conditional
          }
        })
      })
    })
  })

  context('when passed an object', () => {
    it('camelizes keys, not values', () => {
      expect(camelize({ hello_world: 'how_are_you' })).toEqual({ helloWorld: 'how_are_you' })
    })

    it.skip('type test', () => {
      const alteredCase = camelize({ hello_world: 'how_are_you' })
      if (alteredCase.helloWorld === 'how_are_you') {
        // The previous line will start being a type error if `alteredCase` is anything other
        // than what we've written in conditional
      }
    })

    context('when passed a key with a DateTime value', () => {
      it('does not alter DateTimes', () => {
        const now = DateTime.now()
        expect(camelize({ hello_world: now })).toEqual({ helloWorld: now })
      })
    })

    context('when passed a key with a CalendarDate value', () => {
      it('does not alter CalendarDates', () => {
        const today = CalendarDate.today()
        expect(camelize({ hello_world: today })).toEqual({ helloWorld: today })
      })
    })

    context('when passed a key with a Dream value', () => {
      it('does not alter Dream models', () => {
        const balloon = Balloon.new()
        expect(camelize({ hello_world: balloon })).toEqual({ helloWorld: balloon })
      })
    })

    context('when passed a key with a null value', () => {
      it('camelizes the key', () => {
        expect(camelize({ hello_world: null })).toEqual({ helloWorld: null })
      })
    })

    context('when passed a key with a boolean value', () => {
      it('camelizes the key', () => {
        expect(camelize({ hello_world: false })).toEqual({ helloWorld: false })
      })
    })

    it.skip('type test', () => {
      const alteredCase = camelize({ hello_world: false })
      if (alteredCase.helloWorld === false) {
        // The previous line will start being a type error if `alteredCase` is anything other
        // than what we've written in conditional
      }
    })

    context('when passed a key with an undefined value', () => {
      it('does not crash', () => {
        expect(camelize({ hello_world: undefined })).toEqual({})
      })
    })
  })

  context('recurses', () => {
    const object = {
      hello_world: [{ goodbye_world: 'kind_world' }, 'for_now'],
      world_home: { earth_home: 'home_sweet_home' },
    } as const

    it('camelizes keys', () => {
      expect(camelize(object)).toEqual({
        helloWorld: [{ goodbyeWorld: 'kind_world' }, 'for_now'],
        worldHome: { earthHome: 'home_sweet_home' },
      })
    })

    it.skip('type test', () => {
      const alteredCase = camelize(object)

      if (
        alteredCase.worldHome.earthHome === 'home_sweet_home' ||
        alteredCase.helloWorld[0].goodbyeWorld === 'kind_world' ||
        alteredCase.helloWorld[1] === 'for_now'
      ) {
        // The previous line will start being a type error if `alteredCase` is anything other
        // than what we've written in conditional
      }
    })
  })
})
