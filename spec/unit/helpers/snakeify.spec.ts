import { DateTime } from 'luxon'
import snakeify from '../../../src/helpers/snakeify'
import Balloon from '../../../test-app/app/models/Balloon'

describe('snakeify', () => {
  context('when passed a string', () => {
    it('undercases string', () => {
      expect(snakeify('HelloWorld-how-are---you')).toEqual('hello_world_how_are_you')
    })

    it.skip('type test', () => {
      const alteredCase = snakeify('HelloWorld-how-are---you')
      if (alteredCase === 'hello_world_how_are_you') {
        // The previous line will start being a type error if `alteredCase` is anything other
        // than what we've written in conditional
      }
    })

    context('periods', () => {
      it('are ignored', () => {
        expect(snakeify('Hello.World')).toEqual('hello.world')
      })
    })

    it.skip('type test', () => {
      const alteredCase = snakeify('Hello.World')
      if (alteredCase === 'hello.world') {
        // The previous line will start being a type error if `alteredCase` is anything other
        // than what we've written in conditional
      }
    })

    context('slashes', () => {
      it('are ignored', () => {
        expect(snakeify('Hello/World')).toEqual('hello/world')
      })
    })

    it.skip('type test', () => {
      const alteredCase = snakeify('Hello/World')
      if (alteredCase === 'hello/world') {
        // The previous line will start being a type error if `alteredCase` is anything other
        // than what we've written in conditional
      }
    })
  })

  context('when passed an object', () => {
    it('undercases keys, not values', () => {
      expect(snakeify({ helloWorld: 'howAreYou' })).toEqual({ hello_world: 'howAreYou' })
    })

    context('when passed a key with a date time value', () => {
      it('does not alter DateTimes', () => {
        const now = DateTime.now()
        expect(snakeify({ helloWorld: now })).toEqual({ hello_world: now })
      })
    })

    context('when passed a key with a date time value', () => {
      it('does not alter Dream models', () => {
        const balloon = new Balloon()
        expect(snakeify({ helloWorld: balloon })).toEqual({ hello_world: balloon })
      })
    })

    context('when passed a key with a null value', () => {
      it('undercases the key', () => {
        expect(snakeify({ helloWorld: null })).toEqual({ hello_world: null })
      })
    })

    context('when passed a key with an undefined value', () => {
      it('does not crash', () => {
        expect(snakeify({ helloWorld: undefined })).toEqual({})
      })
    })
  })

  context('recurses', () => {
    const object = {
      helloWorld: [{ goodbyeWorld: 'kindWorld' }, 'forNow'],
      worldHome: { earthHome: 'homeSweetHome' },
    } as const

    it('undercases keys', () => {
      expect(snakeify(object)).toEqual({
        hello_world: [{ goodbye_world: 'kindWorld' }, 'forNow'],
        world_home: { earth_home: 'homeSweetHome' },
      })
    })

    it.skip('type test', () => {
      const alteredCase = snakeify(object)

      if (
        alteredCase['world_home']['earth_home'] === 'homeSweetHome' ||
        alteredCase['hello_world'][0]['goodbye_world'] === 'kindWorld' ||
        alteredCase['hello_world'][1] === 'forNow'
      ) {
        // The previous line will start being a type error if `alteredCase` is anything other
        // than what we've written in conditional
      }
    })
  })
})
