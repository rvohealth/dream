import snakeify from '../../../src/helpers/snakeify'

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
  })
})
