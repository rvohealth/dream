import { DateTime } from 'luxon'
import hyphenize from '../../../src/helpers/hyphenize'
import Balloon from '../../../test-app/app/models/Balloon'
import { CalendarDate } from '../../../src'

describe('hyphenize', () => {
  context('when passed a string', () => {
    it('hyphenizes string', () => {
      expect(hyphenize('HelloWorld_how_are___you')).toEqual('hello-world-how-are-you')
    })

    context('periods', () => {
      it('are ignored', () => {
        expect(hyphenize('Hello.World')).toEqual('hello.world')
      })
    })

    it.skip('type test', () => {
      const alteredCase = hyphenize('Hello.World')
      if (alteredCase === 'hello.world') {
        // The previous line will start being a type error if `alteredCase` is anything other
        // than what we've written in conditional
      }
    })

    context('slashes', () => {
      it('are ignored', () => {
        expect(hyphenize('Hello/World')).toEqual('hello/world')
      })
    })

    it.skip('type test', () => {
      const alteredCase = hyphenize('Hello/World')
      if (alteredCase === 'hello/world') {
        // The previous line will start being a type error if `alteredCase` is anything other
        // than what we've written in conditional
      }
    })

    context('spaces', () => {
      context('single space', () => {
        it('are camelized', () => {
          expect(hyphenize('hello world')).toEqual('hello-world')
        })

        it.skip('type test', () => {
          const alteredCase = hyphenize('hello world')
          if (alteredCase === 'hello-world') {
            // The previous line will start being a type error if `alteredCase` is anything other
            // than what we've written in conditional
          }
        })
      })

      context('multiple spaces', () => {
        it('are camelized', () => {
          expect(hyphenize('hello    world')).toEqual('hello-world')
        })

        it.skip('type test', () => {
          const alteredCase = hyphenize('hello   world')
          if (alteredCase === 'hello-world') {
            // The previous line will start being a type error if `alteredCase` is anything other
            // than what we've written in conditional
          }
        })
      })
    })
  })

  context('when passed an object', () => {
    it('hyphenizes keys, not values', () => {
      expect(hyphenize({ helloWorld: 'howAreYou' })).toEqual({ 'hello-world': 'howAreYou' })
    })

    context('when passed a key with a DateTime value', () => {
      it('does not alter DateTimes', () => {
        const now = DateTime.now()
        expect(hyphenize({ helloWorld: now })).toEqual({ 'hello-world': now })
      })
    })

    context('when passed a key with a CalendarDate value', () => {
      it('does not alter CalendarDates', () => {
        const today = CalendarDate.today()
        expect(hyphenize({ helloWorld: today })).toEqual({ 'hello-world': today })
      })
    })

    context('when passed a key with a Dream value', () => {
      it('does not alter Dream models', () => {
        const balloon = new Balloon()
        expect(hyphenize({ helloWorld: balloon })).toEqual({ 'hello-world': balloon })
      })
    })

    context('when passed a key with a null value', () => {
      it('hyphenizes the key', () => {
        expect(hyphenize({ helloWorld: null })).toEqual({ 'hello-world': null })
      })
    })

    context('when passed a key with an undefined value', () => {
      it('does not crash', () => {
        expect(hyphenize({ helloWorld: undefined })).toEqual({})
      })
    })
  })

  context('recurses', () => {
    const object = {
      helloWorld: [{ goodbyeWorld: 'kindWorld' }, 'forNow'],
      worldHome: { earthHome: 'homeSweetHome' },
    } as const

    it('hyphenizes keys', () => {
      expect(hyphenize(object)).toEqual({
        'hello-world': [{ 'goodbye-world': 'kindWorld' }, 'forNow'],
        'world-home': { 'earth-home': 'homeSweetHome' },
      })
    })

    it.skip('type test', () => {
      const alteredCase = hyphenize(object)

      if (
        alteredCase['world-home']['earth-home'] === 'homeSweetHome' ||
        alteredCase['hello-world'][0]['goodbye-world'] === 'kindWorld' ||
        alteredCase['hello-world'][1] === 'forNow'
      ) {
        // The previous line will start being a type error if `alteredCase` is anything other
        // than what we've written in conditional
      }
    })
  })
})
