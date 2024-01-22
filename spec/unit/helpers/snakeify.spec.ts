import { DateTime } from 'luxon'
import snakeify from '../../../shared/helpers/snakeify'
import User from '../../../test-app/app/models/User'

describe('snakeify', () => {
  context('when passed a string', () => {
    it('undercases string', () => {
      expect(snakeify('HelloWorld-how-are---you')).toEqual('hello_world_how_are_you')
    })
  })

  context('when passed an object', () => {
    it('undercases keys', () => {
      expect(snakeify({ HelloWorld: 'HowAreYou' })).toEqual({ hello_world: 'HowAreYou' })
    })

    context('when passed a key with a date time value', () => {
      it('does not try to parse the DateTime as an object', () => {
        const now = DateTime.now()
        expect(snakeify({ HelloWorld: now })).toEqual({ hello_world: now })
      })
    })

    context('when passed a key with a null value', () => {
      it('does not crash', () => {
        expect(snakeify({ helloWorld: null })).toEqual({ hello_world: null })
      })
    })

    context('when passed a key with an undefined value', () => {
      it('does not crash', () => {
        expect(snakeify({ helloWorld: undefined })).toEqual({})
      })
    })
  })
})
