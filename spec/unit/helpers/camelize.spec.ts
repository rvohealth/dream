import { DateTime } from 'luxon'
import camelize from '../../../shared/helpers/camelize'
import User from '../../../test-app/app/models/User'

describe('camelize', () => {
  context('when passed a string', () => {
    it('camelizes string', () => {
      expect(camelize('HelloWorld-how-are-you')).toEqual('helloWorldHowAreYou')
    })
  })

  context('when passed an object', () => {
    it('undercases keys', () => {
      expect(camelize({ helloWorld: 'HowAreYou' })).toEqual({ helloWorld: 'HowAreYou' })
    })

    context('when passed a key with a date time value', () => {
      it('does not try to parse the DateTime as an object', () => {
        const now = DateTime.now()
        expect(camelize({ helloWorld: now })).toEqual({ helloWorld: now })
      })
    })

    context('when passed a key with a null value', () => {
      it('does not crash', () => {
        expect(camelize({ helloWorld: null })).toEqual({ helloWorld: null })
      })
    })

    context('when passed a key with an undefined value', () => {
      it('does not crash', () => {
        expect(camelize({ helloWorld: undefined })).toEqual({})
      })
    })
  })
})
