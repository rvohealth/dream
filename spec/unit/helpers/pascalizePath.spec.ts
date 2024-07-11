import pascalizePath from '../../../src/helpers/pascalizePath'

describe('pascalizePath', () => {
  context('when passed a string', () => {
    it('pascalizes string', () => {
      expect(pascalizePath('hello/World/how-are-you')).toEqual('HelloWorldHowAreYou')
    })

    it.skip('type test', () => {
      const alteredCase = pascalizePath('hello/World/how-are-you')
      if (alteredCase === 'HelloWorldHowAreYou') {
        // The previous line will start being a type error if `alteredCase` is anything other
        // than what we've written in conditional
      }
    })

    context('when the string is snake case, and a number starts one of the sections of the string', () => {
      it('pascalizes string', () => {
        expect(pascalizePath('fiber/2016/2018/2020/2022_2024')).toEqual('Fiber20162018202020222024')
      })
    })
  })
})
