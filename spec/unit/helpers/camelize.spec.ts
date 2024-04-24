import { DateTime } from 'luxon'
import camelize from '../../../src/helpers/camelize'

describe('camelize', () => {
  context('when passed a string', () => {
    it('camelizes string', () => {
      expect(camelize('HelloWorld-how-are-you')).toEqual('helloWorldHowAreYou')
    })

    context('when the string is snake case, and a number starts one of the sections of the string', () => {
      it('camelizes string', () => {
        expect(camelize('fiber_2016_2018_2020_2022_2024')).toEqual('fiber20162018202020222024')
      })
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
