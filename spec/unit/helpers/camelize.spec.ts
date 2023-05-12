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
})
