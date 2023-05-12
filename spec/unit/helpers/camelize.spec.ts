import { DateTime } from 'luxon'
import camelize from '../../../src/helpers/camelize'

describe('camelize', () => {
  context('when passed a string', () => {
    it('camelizes string', () => {
      expect(camelize('HelloWorld-how-are-you')).toEqual('helloWorldHowAreYou')
    })
  })

  context('when passed an object', () => {
    it('undercases keys', () => {
      expect(camelize({ hello_world: 'HowAreYou' })).toEqual({ helloWorld: 'HowAreYou' })
    })
  })

  context('when passed a key with a date time value', () => {
    it('does not try to parse the DateTime as an object', () => {
      const now = DateTime.now()
      expect(camelize({ hello_world: now })).toEqual({ helloWorld: now })
    })
  })
})
